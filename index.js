const pptr = require("puppeteer");
const nodeMailer = require("nodemailer");
const path = require("path");

(async () => {
  var arr = [];
  const rollNo = [
    45289,
    // 45224,
    // 45218, 45335, 45264, 45251, 45210, 45246, 45226, 45289, 45216, 45276, 45245,
    // 45219,
  ];
  const browser = await pptr.launch({
    headless: true,
    args: [`--window-size=${1280},${1024}`],
  });

  for (let i = 0; i < rollNo.length; i++) {
    const page = await browser.newPage();
    await page.goto("http://pu.edu.pk/home/results_show/7471");
    await page.setViewport({ width: 1280, height: 1024 });
    await page.waitForSelector("input[name=roll_no]");
    await page.$eval(
      "input[name=roll_no]",
      (el, rollNo) => (el.value = rollNo),
      rollNo[i]
    );
    await page.click('input[name="submitcontact"]');

    await page.waitForSelector("td > div[align=center] > strong");
    const stuName = await page.$$eval(
      "table[align=center] > tbody > tr > td > table[align=center] > tbody > tr > td",
      (element) => {
        return element.map((el) => el.textContent);
      }
    );
    const text = await page.$$eval(
      "td > div[align=center] > strong",
      (element) => {
        return element.map((el) => el.textContent);
      }
    );
    await page.waitForSelector(
      "#news-blocks > section > div > div.nine.columns > div"
    );
    const resultImageElement = await page.$eval(
      "#news-blocks > section > div > div.nine.columns > div",
      (element) => {
        return element.innerHTML;
      }
    );
    await page.setContent(resultImageElement);

    var StudentResult = {
      rollNo: stuName[3],
      name: stuName[5],
      cgpa: text[1],
    };

    await page.pdf({
      path: `resultPdf/${StudentResult.rollNo}.pdf`,
    });

    arr = [...arr, StudentResult];
    await page.close();
    await browser.close();
  }
  // console.log(arr);

  // ***************send result card to email*****************
  let emailTransporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
      user: "muhammadzaidabcd@gmail.com",
      pass: "zrqevitwjvqbkzeb", // your gmail or App Password password
    },
  });

  for (let i = 0; i < arr.length; i++) {
    const resultPath = path.join(__dirname, "./resultPdf");
    let options = {
      from: `"muhammadzaidabcd@gmail.com"`,
      to: `${arr[i].rollNo}@gcslahore.edu.pk`,
      subject: `${arr[i].name} 3rd Semester Result`,
      text: `Assalam -o- Alaikum!, ${arr[i].name}, here is your 3rd Semester Result`,
      attachments: [
        {
          filename: `${arr[i].rollNo}.pdf`,
          path: `${resultPath}/${arr[i].rollNo}.pdf`,
        },
      ],
    };

    emailTransporter.sendMail(options, (err, info) => {
      if (err) console.log(err);
      else {
        console.log("Email Sent successfully using nodejs");
      }
    });
  }
})();


