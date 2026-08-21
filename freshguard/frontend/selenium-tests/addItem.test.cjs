const { Builder, By, until } = require('selenium-webdriver');

async function run() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('http://localhost:5173');

    // Switch to the Food Inventory tab
    await driver.findElement(By.xpath("//button[contains(text(),'Food Inventory')]")).click();

    // Fill the Add Item form
    await driver.findElement(By.name('item_name')).sendKeys('Selenium Test Item');
    await driver.findElement(By.name('quantity')).sendKeys('3');
    await driver.findElement(By.css("select[name='unit']")).sendKeys('kg');
    await driver.findElement(By.css("select[name='category']")).sendKeys('Fresh Produce');
    await driver.findElement(By.name('expiry_date')).sendKeys('2026-09-15');

    await driver.findElement(By.xpath("//button[text()='Add Item']")).click();

    // Wait for the success banner
    let notice = await driver.wait(
      until.elementLocated(By.css('.alert.success')),
      5000
    );
    let text = await notice.getText();
    console.log('RESULT:', text.includes('Item added') ? 'PASS' : 'FAIL', '-', text);
  } finally {
    await driver.quit();
  }
}

run();