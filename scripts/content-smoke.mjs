import assert from "node:assert/strict";
import fs from "node:fs";
import { servicePages } from "../src/servicePages.js";

assert.equal(servicePages.length, 3, "prototype should expose exactly three service pages");

const expected = new Map([
  ["legal", { route: "/legal", toolName: "AI法律助手", primaryCta: "咨询律师" }],
  ["beauty", { route: "/beauty", toolName: "AI智能面诊", primaryCta: "领取完整报告" }],
  ["divination", { route: "/divination", toolName: "国学智能测算", primaryCta: "再转一次" }],
]);

for (const page of servicePages) {
  const expectation = expected.get(page.id);
  assert.ok(expectation, `unexpected page id: ${page.id}`);
  assert.ok(page.id, "page is missing id");
  assert.equal(page.route, expectation.route, `${page.id} needs its own route`);
  assert.equal(page.toolName, expectation.toolName, `${page.id} needs a clean Chinese tool name`);
  assert.equal(page.primaryCta, expectation.primaryCta, `${page.id} primary CTA should match the tool`);
  assert.ok(page.title, `${page.id} is missing title`);
  assert.ok(page.primaryCta, `${page.id} is missing primary CTA`);
  assert.ok(page.secondaryCta, `${page.id} is missing secondary CTA`);
  assert.ok(page.flowSteps.length >= 5, `${page.id} should show the sales flow`);
  assert.ok(page.actions.length >= 3, `${page.id} needs at least three clickable actions`);
  assert.ok(page.tabs.length >= 3, `${page.id} needs bottom navigation items`);
  assert.ok(page.quickActions.length >= 4, `${page.id} needs mobile quick actions`);
  assert.doesNotMatch(JSON.stringify(page), /娉|鍥|绾|鐐|�/, `${page.id} still contains mojibake`);
}

const pageIds = servicePages.map((page) => page.id).sort();
assert.deepEqual(pageIds, ["beauty", "divination", "legal"]);

const routes = servicePages.map((page) => page.route).sort();
assert.deepEqual(routes, ["/beauty", "/divination", "/legal"]);

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const styleSource = fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

assert.match(appSource, /conversionFields/, "conversion modal fields should be configured");
assert.match(appSource, /modal\.fields/, "modal should render configured lead fields");
assert.match(appSource, /modal\.consent/, "modal should render consent copy for lead capture");
assert.match(appSource, /beauty-sticky-actions/, "beauty should expose a sticky primary conversion action");
assert.match(appSource, /function LegalCasesPage/, "legal cases tab should render a dedicated page");
assert.match(appSource, /function LegalProfilePage/, "legal profile tab should render a dedicated page");
assert.match(appSource, /function BeautyReportPage/, "beauty report tab should render a dedicated page");
assert.match(appSource, /function BeautyAdvisorPage/, "beauty advisor tab should render a dedicated page");
assert.match(appSource, /function DivinationHistoryPage/, "divination history tab should render a dedicated page");
assert.match(appSource, /function DivinationProfilePage/, "divination profile tab should render a dedicated page");
assert.match(appSource, /page\.id === "legal" && activeTab === 1/, "legal case tab should switch on activeTab");
assert.match(appSource, /page\.id === "beauty" && activeTab === 2/, "beauty advisor tab should switch on activeTab");
assert.match(appSource, /page\.id === "divination" && activeTab === 2/, "divination profile tab should switch on activeTab");
assert.doesNotMatch(appSource, /page\.id !== "beauty" &&\s*\(\s*<BottomNav/s, "beauty should also render bottom navigation");
assert.match(styleSource, /\.modal-form/, "conversion form styles should exist");
assert.match(styleSource, /\.modal-consent/, "consent row styles should exist");
assert.match(styleSource, /\.beauty-sticky-actions/, "beauty sticky CTA styles should exist");
assert.match(styleSource, /\.tab-page/, "secondary tab page styles should exist");
assert.match(styleSource, /\.tab-card/, "secondary tab cards should be styled");
assert.match(styleSource, /padding-bottom:\s*calc\(90px/, "divination content should reserve room for sticky actions");
assert.match(styleSource, /min-height:\s*44px/, "small tap targets should be at least 44px high");
assert.doesNotMatch(styleSource, /\.phone-frame\s*\{[^}]*border:/s, "mobile page should not render a phone shell border");
assert.doesNotMatch(styleSource, /\.phone-frame\s*\{[^}]*border-radius:/s, "mobile page should not render phone shell rounded corners");
assert.doesNotMatch(styleSource, /\.phone-frame\s*\{[^}]*box-shadow:/s, "mobile page should not render phone shell shadow");
assert.doesNotMatch(styleSource, /\.phone-stage\s*\{[^}]*place-items:\s*center/s, "mobile page should not be centered as a device mockup");
assert.match(styleSource, /--mobile-page-width:\s*430px/, "service pages should cap to mobile page width on desktop");
assert.match(styleSource, /\.phone-frame\s*\{[^}]*width:\s*min\(100vw,\s*var\(--mobile-page-width\)\)/s, "phone frame should use mobile width, not full desktop width");
assert.match(styleSource, /\.phone-screen\s*\{[^}]*width:\s*100%/s, "phone screen should fill the mobile-width frame");
