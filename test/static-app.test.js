import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FEED_ITEMS } from '../src/data.js';

test('document exposes a mobile app mount and module entry', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="app"/);
  assert.match(html, /type="module" src="app\.js"/);
  assert.match(html, /viewport-fit=cover/);
});

test('all twelve zodiac svg assets are declared', async () => {
  const source = await readFile(new URL('../src/data.js', import.meta.url), 'utf8');
  for (const file of ['01-rat','02-ox','03-tiger','04-rabbit','05-dragon','06-snake','07-horse','08-goat','09-monkey','10-rooster','11-dog','12-pig']) {
    assert.match(source, new RegExp(`${file}\\.svg`));
  }
});

test('profile exposes Xiaotian as a selectable twelve-style agent', async () => {
  const source = await readFile(new URL('../src/views.js', import.meta.url), 'utf8');
  assert.match(source, /小天智能体/);
  assert.match(source, /12\s*种形象可选/);
  assert.match(source, /ZODIAC_PETS\.map/);
  assert.match(source, /data-pet=/);
});

test('bottom navigation keeps five labeled destinations', async () => {
  const source = await readFile(new URL('../src/views.js', import.meta.url), 'utf8');
  for (const label of ['天使桥', '消息', '创建', '桥约', '我']) assert.match(source, new RegExp(label));
});

test('bottom navigation preserves the original icon arrangement', async () => {
  const css = await readFile(new URL('../ardot.css', import.meta.url), 'utf8');
  const views = await readFile(new URL('../src/views.js', import.meta.url), 'utf8');
  assert.match(css, /\.nav-btn\.home-nav\{[^}]*flex-direction:column-reverse/);
  assert.match(css, /\.home-symbol,\.messages-symbol,\.bridge-symbol,\.profile-symbol\{width:22px;height:22px\}/);
  assert.match(views, /home-symbol[^<]*<circle/);
  assert.match(views, /messages-symbol[^<]*<path/);
  assert.match(views, /bridge-symbol[^<]*<path/);
  assert.match(views, /profile-symbol[^<]*<circle[^>]*\/><path/);
  assert.match(views, /create-symbol[^<]*viewBox="0 0 56 56"[^<]*<circle[^>]*r="27"/);
  assert.match(css, /\.nav-btn\.is-create \.nav-symbol\{[^}]*width:56px;height:56px[^}]*flex:0 0 56px/);
  assert.match(css, /\.create-nav small\{display:none\}/);
});

test('primary screens follow the eight Ardot frames without an invented home hero', async () => {
  const source = `${await readFile(new URL('../src/views.js', import.meta.url), 'utf8')}\n${await readFile(new URL('../src/data.js', import.meta.url), 'utf8')}`;
  for (const screen of ['热门', '视频', '经验', '闲置', '找工作', '找物', '人生树', '找人']) {
    assert.match(source, new RegExp(screen));
  }
  assert.doesNotMatch(source, /home-intro/);
});

test('idle screen contains the complete four-card layout from the Ardot frame', () => {
  assert.equal(FEED_ITEMS.filter(item => item.channel === '闲置').length, 4);
});

test('content-heavy Ardot screens keep the original four-card density', () => {
  for (const channel of ['闲置', '经验', '视频', '热门']) {
    assert.equal(FEED_ITEMS.filter(item => item.channel === channel).length, 4);
  }
});

test('job screen uses the same two-column image-card system as people', async () => {
  const views = await readFile(new URL('../src/views.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../ardot.css', import.meta.url), 'utf8');
  assert.match(views, /activeChannel === '找工作'[^\n]*feed-grid job-grid/);
  assert.match(views, /card\(item,'job-card'\)/);
  assert.doesNotMatch(css, /\.feed-card\.job-row>img\{display:none\}/);
});

test('all two-column content cards share one fixed height', async () => {
  const css = await readFile(new URL('../ardot.css', import.meta.url), 'utf8');
  assert.match(css, /\.feed-grid \.feed-card\{height:270px;display:flex;flex-direction:column\}/);
  assert.match(css, /\.feed-grid \.card-body\{[^}]*flex:1[^}]*display:flex[^}]*flex-direction:column/);
  assert.match(css, /\.feed-grid \.tag-row\{margin-top:auto/);
});

test('status bar uses structured Apple cellular wifi and battery icons', async () => {
  const source = await readFile(new URL('../src/views.js', import.meta.url), 'utf8');
  for (const className of ['cellular-icon', 'wifi-icon', 'battery-icon']) assert.match(source, new RegExp(className));
  assert.doesNotMatch(source, /▮▮▮|⌁|▰/);
});

test('desktop device frame uses the 393 by 852 Apple ratio', async () => {
  const source = await readFile(new URL('../ardot.css', import.meta.url), 'utf8');
  assert.match(source, /aspect-ratio:\s*393\s*\/\s*852/);
});
