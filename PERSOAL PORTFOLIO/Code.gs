const SPREADSHEET_ID = "1ZBVL2M0SPVs7Mj_yUFbJhUJ98MdKGTIvW0crlaa5KFA";
const SHEET_NAME = "Responses";

function doPost(event) {
  try {
    const parameters = getPostParameters(event);
    const name = cleanParameter(parameters.NAME);
    const email = cleanParameter(parameters.EMAIL).toLowerCase();
    const message = cleanParameter(parameters.MESSAGE);

    if (!name || !email || !message) {
      throw new Error("Missing required fields: NAME, EMAIL, or MESSAGE");
    }

    if (name.length > 100) {
      throw new Error("NAME must be 100 characters or fewer");
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid EMAIL address");
    }

    if (message.length > 5000) {
      throw new Error("MESSAGE must be 5000 characters or fewer");
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }

    const header = sheet.getRange(1, 1, 1, 3).getDisplayValues()[0];
    if (header.join("|") !== "NAME|EMAIL|MESSAGE") {
      sheet.getRange(1, 1, 1, 3).setValues([["NAME", "EMAIL", "MESSAGE"]]);
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      sheet.appendRow([name, email, message]);
    } finally {
      lock.releaseLock();
    }

    console.log("Form submission saved successfully");

    return textResponse("Success");
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return textResponse("Error: " + (error && error.message ? error.message : "Unknown error"));
  }
}

function getPostParameters(event) {
  const parameters = event && event.parameter ? event.parameter : {};

  if (event && event.postData && event.postData.contents) {
    const contentType = String(event.postData.type || "").toLowerCase();

    if (contentType.indexOf("application/json") !== -1) {
      try {
        const body = JSON.parse(event.postData.contents);
        return Object.assign({}, parameters, body || {});
      } catch (error) {
        throw new Error("Invalid JSON request body");
      }
    }

    if (contentType.indexOf("application/x-www-form-urlencoded") !== -1) {
      const formParameters = {};
      const pairs = event.postData.contents.split("&");

      pairs.forEach(function(pair) {
        if (!pair) return;
        const index = pair.indexOf("=");
        const rawKey = index === -1 ? pair : pair.substring(0, index);
        const rawValue = index === -1 ? "" : pair.substring(index + 1);
        formParameters[decodeComponent(rawKey)] = decodeComponent(rawValue);
      });

      return Object.assign({}, parameters, formParameters);
    }
  }

  return parameters;
}

function decodeComponent(value) {
  try {
    return decodeURIComponent(String(value).replace(/\+/g, " "));
  } catch (error) {
    return String(value).replace(/\+/g, " ");
  }
}

function cleanParameter(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function textResponse(content) {
  return ContentService
    .createTextOutput(content)
    .setMimeType(ContentService.MimeType.TEXT);
}

function testFormSubmission() {
  const response = doPost({
    parameter: {
      NAME: "Test Name",
      EMAIL: "test@example.com",
      MESSAGE: "Test message"
    }
  });
  console.log(response.getContent());
}

function doGet() {
  return textResponse("Apps Script is running");
}
