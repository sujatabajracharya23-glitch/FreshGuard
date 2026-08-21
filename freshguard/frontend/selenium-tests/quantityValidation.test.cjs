const { Builder, By, until } = require('selenium-webdriver');

async function run() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('http://localhost:5173');

    // Switch to the Food Inventory tab
    await driver.findElement(By.xpath("//button[contains(text(),'Food Inventory')]")).click();

    // Fill the form with an INVALID quantity (0) - everything else valid
    await driver.findElement(By.name('item_name')).sendKeys('Bad Quantity Test');
    await driver.findElement(By.name('quantity')).sendKeys('0');
    await driver.findElement(By.css("select[name='unit']")).sendKeys('pcs');
    await driver.findElement(By.css("select[name='category']")).sendKeys('Canned');
    await driver.findElement(By.name('expiry_date')).sendKeys('2026-09-15');

    await driver.findElement(By.xpath("//button[text()='Add Item']")).click();

    // Wait for the error banner
    let notice = await driver.wait(
      until.elementLocated(By.css('.alert.error')),
      5000
    );
    let text = await notice.getText();

    const expected = 'Quantity must be a positive number';
    console.log('RESULT:', text.includes(expected) ? 'PASS' : 'FAIL', '-', text);
  } finally {
    await driver.quit();
  }
}

run();