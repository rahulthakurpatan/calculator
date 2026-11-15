import unittest,pathlib,threading,http.server,socketserver,functools,json,re
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
SLUG='rental-property-roi-calculator'
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
  self.assertIn('GTM-5JP6QNKJ',html)
  self.assertIn('common-pushdotify.js',html)
  self.assertIn('common-branding.js',html)
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
   page.locator('#price').fill('100000');page.locator('#down').fill('100');page.locator('#closing').fill('0');page.locator('#rehab').fill('0');page.locator('#rent').fill('1000');page.locator('#other').fill('0');page.locator('#vacancy').fill('0');page.locator('#tax').fill('0');page.locator('#insurance').fill('0');page.locator('#hoa').fill('0');page.locator('#management').fill('0');page.locator('#maintenance').fill('0');page.locator('#capex').fill('0');page.locator('#calculate').click()
   self.assertIn('12.00%',page.locator('#stats').inner_text())
   self.assertIn('$12,000',page.locator('#stats').inner_text())
   page.locator('#vacancy').fill('10');page.locator('#calculate').click()
   self.assertIn('10.80%',page.locator('#stats').inner_text())
   page.locator('#price').fill('-1');page.locator('#calculate').click()
   self.assertTrue(page.locator('#results').is_hidden())
   self.assertFalse(errors,str(errors))
   self.assertLessEqual(page.evaluate('document.documentElement.scrollWidth'),width+2)
   page.close()
if __name__=='__main__': unittest.main()
