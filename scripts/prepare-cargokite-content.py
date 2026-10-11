"""Convert browser-observed markup into script-free, local replica templates."""
import json
import re
from pathlib import Path
from urllib.parse import urljoin
from bs4 import BeautifulSoup

root = Path(__file__).resolve().parent.parent
audit = root / '.cache/cargokite'
output = root / 'artifacts/frontend/src/cargokite/content'
output.mkdir(parents=True, exist_ok=True)
assets = json.loads((audit / 'asset-map.json').read_text(encoding='utf8'))

for page in ['home', 'about', 'tech', 'news', 'privacy', 'legal']:
    soup = BeautifulSoup((audit / f'{page}.html').read_text(encoding='utf8'), 'html.parser')
    event_file = audit / 'event.html'
    if event_file.exists():
        captured_event = BeautifulSoup(event_file.read_text(encoding='utf8'), 'html.parser').select_one('.event.popup')
        target_event = soup.select_one('.event.popup')
        if captured_event and target_event:
            target_event.replace_with(captured_event)
    for element in soup.select('script, .trans__wrapper, #cc--main, .tech-control'):
        element.decompose()
    main = soup.select_one('.main')
    if main:
        main.name = 'main'
    if page == 'tech' and not soup.select_one('footer'):
        shared = BeautifulSoup((audit / 'home.html').read_text(encoding='utf8'), 'html.parser').select_one('footer')
        soup.select_one('.wrapper').append(shared)
    if page == 'tech' and not soup.select_one('[data-popup=download]'):
        study_link = soup.new_tag('a', href='#study')
        study_link['class'] = ['txt', 'txt-18', 'txt-link', 'hover-un', 'ck-study-link']
        study_link['data-popup'] = 'download'
        study_link.string = 'Get your custom study today'
        soup.select_one('.tech-intro__map-head').append(study_link)
    for element in soup.select('.pin-spacer'):
        element.unwrap()
    for heading in soup.select('.heading'):
        if heading.select_one('.g-lines'):
            heading['class'] = heading.get('class', []) + ['ck-split-heading']
    for element in soup.select('.g-lines'):
        element.insert_after(' ')
        element.unwrap()
    for element in list(soup.select('[style]')):
        style = element.get('style', '')
        compact = style.replace(' ', '')
        if 'position:relative' in compact and 'display:inline-block' in compact and element.name in ['div', 'span'] and not element.get('class'):
            if '-' in element.get_text() and not re.search(r'\s', element.get_text().strip()):
                element.name = 'span'
                element['class'] = ['ck-word']
                element.attrs.pop('style', None)
            else:
                element.unwrap()
            continue
        # GSAP's captured frame must not become the replica's initial state.
        declarations = [item for item in style.split(';') if item.strip() and not re.match(r'\s*(transform|translate|rotate|scale|opacity|visibility|clip-path|will-change|inset|top|left|right|bottom)\s*:', item)]
        if element.get('class') and not any('leaflet' in c for c in element['class']):
            declarations = [item for item in declarations if not re.match(r'\s*((?:min-|max-)?(?:width|height)|position|padding|margin)\s*:', item)]
        if declarations:
            element['style'] = ';'.join(declarations)
        else:
            element.attrs.pop('style', None)
    for element in soup.find_all(True):
        for key in list(element.attrs):
            if key.lower().startswith('on') or key == 'data-snip-rule':
                del element[key]
        for key in ['src', 'poster']:
            if element.get(key):
                value = urljoin('https://cargokite.com/', element[key])
                if value in assets:
                    element[key] = assets[value]
        if element.get('srcset'):
            if not element.get('src'):
                value = urljoin('https://cargokite.com/', element['srcset'].split(',')[0].strip().split(' ')[0])
                if value in assets:
                    element['src'] = assets[value]
            element.attrs.pop('srcset', None)
        if element.get('data-src'):
            value = urljoin('https://cargokite.com/', element['data-src'])
            if value in assets:
                element['src'] = assets[value]
            element.attrs.pop('data-src', None)
        if element.get('href') in ['./', './index.html']:
            element['href'] = '/'
        if element.name == 'a' and element.get('href', '').startswith(('https:', 'http:')):
            element['target'] = '_blank'
            element['rel'] = 'noopener noreferrer'
        if element.get('class'):
            element['class'] = [c for c in element['class'] if c not in ['force-hidden', 'lenis', 'lenis-smooth']]
        if element.name == 'img':
            element['loading'] = 'eager' if 'hero' in ' '.join(element.get('class', [])) else 'lazy'
        if element.name == 'svg' and element.get('viewbox'):
            element['viewBox'] = element.attrs.pop('viewbox')
    for control in soup.select('.popup__close, .header__toggle, .header__menu-btn'):
        control['aria-label'] = 'Close dialog' if 'popup__close' in control.get('class', []) else 'Toggle navigation'
        control['role'] = 'button'
    for popup in soup.select('.popup'):
        popup['class'] = [c for c in popup.get('class', []) if c != 'active']
        popup['role'] = 'dialog'
        popup['aria-modal'] = 'true'
        popup['aria-hidden'] = 'true'
        popup['inert'] = ''
        popup['tabindex'] = '-1'
        popup['aria-label'] = 'Event details' if 'event' in popup.get('class', []) else 'Contact CargoKite'
    for form in soup.select('.popup__main-form'):
        form['data-ck-form'] = 'study' if form.find_parent(class_='download') else 'contact'
        for field in form.select('input, textarea'):
            field['aria-label'] = field.get('placeholder', field.get('name', 'Field'))
            if field.get('name') == 'name':
                field['minlength'] = '2'
                field['maxlength'] = '100'
            if field.name == 'textarea':
                field['required'] = ''
                field['minlength'] = '10'
                field['maxlength'] = '1950'
    for form in soup.select('.footer__form-main'):
        form['data-ck-form'] = 'newsletter'
        field = form.select_one('input[type=email]')
        if field:
            field['aria-label'] = 'Email address for newsletter'
            field['maxlength'] = '254'
    for logo in soup.select('.news-hero__logo-ex-item.active'):
        logo['class'].remove('active')
    # Browser-rendered maps are replaced with our own free-tile Leaflet instance.
    for tile in soup.select('.leaflet-tile-pane, .leaflet-shadow-pane, .leaflet-marker-pane, .leaflet-overlay-pane, .leaflet-control-container'):
        tile.decompose()
    for map_element in soup.select('.leaflet-container'):
        map_element.clear()
        map_element['data-ck-map'] = ''
        map_element.attrs.pop('style', None)
    html = str(soup)
    for remote, local in sorted(assets.items(), key=lambda pair: -len(pair[0])):
        html = html.replace(remote, local)
    (output / f'{page}.html').write_text(html, encoding='utf8')
    print(f'Prepared {page}: {len(html):,} characters')
