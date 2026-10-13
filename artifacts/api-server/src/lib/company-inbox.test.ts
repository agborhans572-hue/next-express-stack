import assert from "node:assert/strict";
import test from "node:test";
import { COMPANY_INBOX, companyInboxEmail } from "./company-inbox";

test("company notifications use the info inbox and escape submitted content", () => {
  const mail = companyInboxEmail("New <message>", {
    Name: '<script>alert("test")</script>',
    Message: "First line\nSecond & last line",
  });
  assert.equal(mail.toEmail, COMPANY_INBOX);
  assert.equal(mail.toEmail, "info@shiprion.com");
  assert.ok(mail.html.includes("&lt;script&gt;"));
  assert.ok(mail.html.includes("First line<br>Second &amp; last line"));
  assert.ok(!mail.html.includes("<script>"));
});
