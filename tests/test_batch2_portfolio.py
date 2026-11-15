import unittest, pathlib, threading, http.server, socketserver, functools, re, json
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
SLUG='portfolio-rebalancing-calculator'
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
class Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=socketserver.TCPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
  cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
  cls.playwright=sync_playwright().start();cls.browser=cls.playwright.chromium.launch(headless=True)
 @classmethod
 def tearDownClass(cls): cls.browser.close();cls.playwright.stop();cls.server.shutdown();cls.server.server_close()
 def test_static(self):
  html=(ROOT/SLUG/'index.html').read_text()
  self.assertEqual(html.count('adsbygoogle.js'),1)
  self.assertIn('rel="canonical" href="https://returnoninvestmentcalculator.in/'+SLUG+'/',html)
  self.assertIn('/assets/js/common-pushdotify.js',html)
  self.assertIn('/assets/js/common-branding.js',html)
  self.assertIn('GTM-5JP6QNKJ',html)
  self.assertIn('https://returnoninvestmentcalculator.in/'+SLUG+'/',(ROOT/'sitemap.xml').read_text())
  for f in ['common-header.js','common-footer.js','common-search.js']:
   self.assertIn('/'+SLUG+'/',(ROOT/'assets/js'/f).read_text())
  for s in re.findall(r'<script type="application/ld\\+json">(.*?)</script>',html,re.S): json.loads(s)
 def test_browser(self):
  for width in [375,1440]:
   page=self.browser.new_page(viewport={'width':width,'height':850})
   page.route('https://**/*',lambda route: route.abort())
   errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{self.server.server_address[1]}/{SLUG}/')
   page.locator('#calculate').click()
   self.assertIn('Sell',page.locator('#rows').inner_text())
   self.assertIn('$1,000',page.locator('#rows').inner_text())
   page.locator('#cash').fill('2000');page.locator('#mode').select_option('buy');page.locator('#calculate').click()
   self.assertNotIn('Sell',page.locator('#rows').inner_text())
   self.assertIn('$1,800',page.locator('#rows').inner_text())
   page.locator('.target').first.fill('70');page.locator('#calculate').click()
   self.assertIn('100%',page.locator('#error').inner_text())
   self.assertTrue(page.locator('#results').is_hidden())
   self.assertFalse(errors,str(errors))
   self.assertLessEqual(page.evaluate('document.documentElement.scrollWidth'),width+2)
   page.close()
if __name__=='__main__': unittest.main()
