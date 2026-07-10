"""
ЭТАП 2: Парсинг законов с форума Majestic RP.
Читает forum_structure.json, ходит по выбранным разделам,
берёт ТОЛЬКО первый пост каждой темы (без комментариев и подписи),
сохраняет в majestic_laws.csv
"""
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import pandas as pd
import json
import time
import re

# Какие разделы парсим (id из forum_structure.json)
WANTED_IDS = {'84', '255', '353', '354', '258', '344'}

ROOT = 'https://forum.majestic-rp.ru/'


def absolute(href):
    if href.startswith('http'):
        return href
    return 'https://forum.majestic-rp.ru' + ('' if href.startswith('/') else '/') + href


def section_id_from_url(url):
    """Из URL вида .../forums/name.84/ вытащить '84'."""
    m = re.search(r'\.(\d+)/?$', url.rstrip('/') + '/')
    return m.group(1) if m else None


def extract_law_text(soup):
    """
    Берём ТОЛЬКО первый пост темы (это и есть закон).
    Из него удаляем подпись и блок реакций.
    Комментарии других пользователей при этом игнорируются полностью.
    """
    first_post = soup.find('article', class_='message')
    if not first_post:
        return None

    body = first_post.find('div', class_='message-userContent')
    if not body:
        body = first_post.find('div', class_='bbWrapper')
    if not body:
        return None

    # Дублируем чтоб не портить дерево, и вырезаем мусор
    body_copy = BeautifulSoup(str(body), 'lxml')
    for sig in body_copy.find_all('div', class_='message-signature'):
        sig.decompose()
    for reactions in body_copy.find_all('div', class_='reactionsBar'):
        reactions.decompose()
    for last_edit in body_copy.find_all('div', class_='message-lastEdit'):
        last_edit.decompose()

    bb = body_copy.find('div', class_='bbWrapper') or body_copy
    text = bb.get_text(separator='\n', strip=True)
    # схлопываем пустые строки
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text


# === ЗАГРУЖАЕМ СПИСОК РАЗДЕЛОВ ===
with open('forum_structure.json', 'r', encoding='utf-8') as f:
    structure = json.load(f)

sections_to_parse = []
for sec in structure['law_sections']:
    sid = section_id_from_url(sec['url'])
    if sid in WANTED_IDS:
        sections_to_parse.append(sec)

print(f"Будем парсить {len(sections_to_parse)} разделов:")
for s in sections_to_parse:
    print(f"  - {s['title']}  ({s['estimated_total_threads']} тем)")

all_laws = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                   '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport={'width': 1366, 'height': 768}
    )
    page = context.new_page()

    # Проходим Cloudflare на главной
    print("\nПроходим Cloudflare...")
    page.goto(ROOT, wait_until='domcontentloaded')
    time.sleep(8)

    # === ЭТАП А: собираем ссылки на все темы из всех разделов ===
    print("\n[А] Собираем ссылки на темы...")
    thread_links = []  # [{section, section_url, title, url}, ...]

    for sec in sections_to_parse:
        print(f"\n  Раздел: {sec['title']} ({sec['url']})")
        n_pages = sec.get('pages', 1)

        for i in range(1, n_pages + 1):
            page_url = sec['url'] if i == 1 else sec['url'].rstrip('/') + f'/page-{i}'
            try:
                page.goto(page_url, wait_until='domcontentloaded', timeout=30000)
                page.wait_for_selector('div.structItem--thread', timeout=15000)
            except Exception as e:
                print(f"    стр {i}: ошибка ({e}), пропуск")
                continue

            bs = BeautifulSoup(page.content(), 'lxml')
            threads = bs.find_all('div', class_='structItem--thread')
            print(f"    стр {i}/{n_pages}: {len(threads)} тем")

            for t in threads:
                title_a = t.find('div', class_='structItem-title')
                if not title_a:
                    continue
                a = title_a.find('a')
                if not a:
                    continue
                thread_links.append({
                    'section': sec['title'],
                    'section_url': sec['url'],
                    'title': a.get_text(strip=True),
                    'url': absolute(a['href'])
                })
            time.sleep(1)

    # дедуп по url
    seen = set()
    unique_threads = []
    for t in thread_links:
        if t['url'] not in seen:
            seen.add(t['url'])
            unique_threads.append(t)
    print(f"\nВсего уникальных тем для парсинга: {len(unique_threads)}")

    # === ЭТАП Б: заходим в каждую тему и берём первый пост ===
    print("\n[Б] Парсим темы...")
    for idx, t in enumerate(unique_threads, 1):
        try:
            page.goto(t['url'], wait_until='domcontentloaded', timeout=30000)
            page.wait_for_selector('article.message', timeout=15000)
            bs = BeautifulSoup(page.content(), 'lxml')

            content = extract_law_text(bs)

            # дата создания темы
            first_post = bs.find('article', class_='message')
            date_el = first_post.find('time') if first_post else None
            date_val = date_el.get('datetime') if date_el else ''

            all_laws.append({
                'section': t['section'],
                'law_title': t['title'],
                'link': t['url'],
                'date': date_val,
                'content': content or ''
            })
            print(f"  [{idx}/{len(unique_threads)}] {t['title'][:60]}")
            time.sleep(0.8)
        except Exception as e:
            print(f"  [{idx}/{len(unique_threads)}] ошибка: {e}")
            all_laws.append({
                'section': t['section'],
                'law_title': t['title'],
                'link': t['url'],
                'date': '',
                'content': ''
            })
            continue

        # каждые 50 тем — промежуточное сохранение
        if idx % 50 == 0:
            pd.DataFrame(all_laws).to_csv('majestic_laws.csv', index=False, encoding='utf-8-sig')
            print(f"  (промежуточное сохранение: {idx} тем)")

    browser.close()

# Финальное сохранение
df = pd.DataFrame(all_laws)
df.to_csv('majestic_laws.csv', index=False, encoding='utf-8-sig')

print(f"\n=== ГОТОВО ===")
print(f"Сохранено законов: {len(df)}")
print(f"С непустым текстом: {(df['content'].str.len() > 0).sum()}")
print(f"Файл: majestic_laws.csv")