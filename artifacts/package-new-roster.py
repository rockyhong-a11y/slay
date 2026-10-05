"""Format/size delivery assets and build QA contact sheets; no creative image edits."""
import json
import shutil
import sys
from pathlib import Path
from PIL import Image, ImageDraw

STATE_ORDER = ['normal', 'excited', 'fiery', 'frustrated', 'tired', 'groggy']
metadata = json.loads(Path('artifacts/new-roster-prompts.json').read_text())
ids = sys.argv[1:] or ['atlas', 'seraph', 'lynx', 'tempest', 'onyx']
for fighter in ids:
    for record in metadata['assets']:
        if record['id'] != fighter:
            continue
        source = Path(record['generatedSource'])
        saved = Path(record['savedSource'])
        saved.parent.mkdir(parents=True, exist_ok=True)
        if not saved.exists():
            shutil.copyfile(source, saved)
        output = Path(record['output'])
        if not output.exists():
            image = Image.open(saved).convert('RGBA').resize((1000, 1500), Image.Resampling.LANCZOS)
            image.save(output, 'WEBP', quality=93, method=6)
        image = Image.open(output).convert('RGBA')
        alpha = image.getchannel('A')
        print(fighter, record['state'], image.size, alpha.getextrema(), 'transparent fraction', round(sum(value == 0 for value in alpha.getdata()) / 1500000, 3), 'visible bounds', alpha.point(lambda value: 255 if value > 128 else 0).getbbox(), flush=True)
    normal = Path(f'public/assets/fighters/states/{fighter}-normal.webp')
    shutil.copyfile(normal, f'public/assets/fighters/{fighter}.webp')
    sheet = Image.new('RGB', (1320, 365), (24, 28, 34))
    draw = ImageDraw.Draw(sheet)
    for index, state in enumerate(STATE_ORDER):
        output = Path(f'public/assets/fighters/states/{fighter}-{state}.webp')
        if not output.exists():
            continue
        image = Image.open(output).convert('RGBA')
        image.thumbnail((215, 330))
        sheet.paste(image, (index * 220 + (220 - image.width) // 2, 20), image)
        draw.text((index * 220 + 7, 347), state, fill='white')
    sheet.save(f'artifacts/new-roster-{fighter}-review.jpg', quality=92)
