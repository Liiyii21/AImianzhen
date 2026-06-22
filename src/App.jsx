import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Droplets,
  FileChartLine,
  FileText,
  Gem,
  Handshake,
  Headphones,
  HeartHandshake,
  Home,
  Info,
  Leaf,
  MessageCircle,
  MessagesSquare,
  MoonStar,
  RotateCw,
  Scale,
  ScanFace,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  User,
  UsersRound,
  X,
} from "lucide-react";
import { servicePages } from "./servicePages.js";

const icons = {
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  ClipboardList,
  Droplets,
  FileChartLine,
  FileText,
  Gem,
  Handshake,
  Headphones,
  HeartHandshake,
  Leaf,
  MessageCircle,
  MessagesSquare,
  MoonStar,
  Scale,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  UsersRound,
};

const extraDivinationFortunes = [
  {
    title: "贵人方位提示",
    score: "76",
    items: [
      ["事业运势", "今日适合先整理资源，再主动联系关键人，北向与东向机会更明显。"],
      ["财富建议", "避免冲动投入，先复盘预算和现金流，稳健推进更有利。"],
    ],
  },
  {
    title: "转机能量解读",
    score: "95",
    items: [
      ["事业运势", "新的合作窗口正在打开，适合主动表达方案并争取更高权限。"],
      ["感情运势", "沟通中多给对方确定感，关系会更容易进入正向循环。"],
    ],
  },
  {
    title: "静心蓄势建议",
    score: "81",
    items: [
      ["事业运势", "今天宜守中带进，先把手头事项闭环，再寻找下一步突破口。"],
      ["财富建议", "适合做长期规划，不宜被短期波动带着走。"],
    ],
  },
];

const legalCases = [
  {
    type: "债权债务",
    title: "8万元借款追回",
    status: "证据完整",
    detail: "借条、转账记录和聊天承诺齐全，先发律师函，再准备起诉材料。",
    result: "7日内达成分期还款方案",
  },
  {
    type: "劳动纠纷",
    title: "离职补偿沟通",
    status: "材料待补",
    detail: "整理劳动合同、工资流水、考勤记录和离职沟通截图，判断仲裁诉求。",
    result: "补齐证据后进入仲裁准备",
  },
  {
    type: "婚姻家事",
    title: "财产与抚养权咨询",
    status: "适合面谈",
    detail: "先梳理共同财产、子女照护事实和沟通记录，再制定谈判方案。",
    result: "预约律师面谈确认路径",
  },
];

const legalProfileItems = [
  ["我的咨询", "2个待跟进", "债务纠纷已生成材料清单，劳动纠纷等待补充合同。"],
  ["材料夹", "6份文件", "借条、转账记录、聊天记录、工资流水可继续补充。"],
  ["预约记录", "明日 15:00", "视频面谈待确认，律师会提前查看已提交材料。"],
];

const beautyReportItems = [
  ["肤质判断", "混合偏干", "T 区轻微出油，两颊屏障偏弱，建议先做稳定修护。"],
  ["优先问题", "缺水细纹", "眼周和法令纹区域需要补水、抗氧与温和促循环。"],
  ["项目建议", "补水修护", "先从低刺激护理开始，再根据耐受度进入进阶方案。"],
];

const beautyAdvisorItems = [
  ["顾问跟进", "待联系", "提交预算和目标后，顾问会给到可执行护理节奏。"],
  ["到店计划", "建议 7 日内", "适合先做皮肤检测，再确认项目和周期。"],
  ["私域服务", "可领取", "完整报告、注意事项和居家护理清单可继续发送。"],
];

const divinationHistory = [
  {
    date: "今日 10:09",
    title: "今日运势解读",
    score: "88分",
    focus: "事业、感情",
    note: "适合主动推进沟通，贵人机会更明显。",
  },
  {
    date: "昨日 21:35",
    title: "本周能量提示",
    score: "92分",
    focus: "财富、机会",
    note: "稳健规划预算，旧资源可能带来新窗口。",
  },
  {
    date: "06月20日",
    title: "静心蓄势建议",
    score: "81分",
    focus: "复盘、决策",
    note: "先完成手头事项，再做下一步投入。",
  },
];

const divinationProfileItems = [
  ["我的档案", "Explorer Leo", "已保存昵称、关注方向和最近测算偏好。"],
  ["收藏报告", "3份", "事业运势、财富建议、感情沟通可随时回看。"],
  ["深度咨询", "1次待跟进", "顾问会结合历史测算继续解读关键问题。"],
];

const conversionFields = {
  legal: {
    lawyer: {
      success: "咨询线索已记录，律师顾问会按您填写的时间联系。",
      consent: "同意将称呼、电话和咨询摘要用于律师顾问回访。",
      fields: [
        { name: "name", label: "称呼", placeholder: "例如：王女士", required: true },
        { name: "phone", label: "联系电话", type: "tel", placeholder: "请输入手机号", required: true },
        { name: "time", label: "方便沟通时间", placeholder: "例如：今天 18:00 后", required: true },
        { name: "summary", label: "补充说明", as: "textarea", placeholder: "简单补充金额、证据或诉求" },
      ],
    },
    booking: {
      success: "面谈预约已提交，稍后会确认具体时间和沟通方式。",
      consent: "同意使用预约信息安排线下或视频面谈。",
      fields: [
        { name: "name", label: "称呼", placeholder: "例如：李先生", required: true },
        { name: "phone", label: "联系电话", type: "tel", placeholder: "请输入手机号", required: true },
        { name: "channel", label: "面谈方式", as: "select", required: true, options: ["视频面谈", "线下面谈", "电话先沟通"] },
        { name: "time", label: "期望时间", placeholder: "例如：周三下午", required: true },
      ],
    },
  },
  beauty: {
    report: {
      success: "完整报告领取信息已提交，顾问会发送报告并继续跟进。",
      consent: "同意将面诊结果和联系方式用于报告发送及顾问跟进。",
      fields: [
        { name: "name", label: "称呼", placeholder: "例如：陈女士", required: true },
        { name: "phone", label: "手机号", type: "tel", placeholder: "请输入手机号", required: true },
        { name: "goal", label: "主要改善目标", as: "select", required: true, options: ["补水修护", "痘痘管理", "抗氧抗老", "到店面诊"] },
      ],
    },
    advisor: {
      success: "定制方案需求已提交，顾问会根据预算和目标给方案。",
      consent: "同意顾问基于皮肤目标和预算提供个性化建议。",
      fields: [
        { name: "name", label: "称呼", placeholder: "例如：赵女士", required: true },
        { name: "phone", label: "联系方式", type: "tel", placeholder: "手机号 / 微信号", required: true },
        { name: "budget", label: "预算范围", as: "select", required: true, options: ["先了解", "1000-3000", "3000-8000", "到店再定"] },
      ],
    },
  },
  divination: {
    share: {
      success: "分享卡已生成，可发送给好友或私域群。",
      consent: "同意生成包含昵称和测算结果的分享卡片。",
      fields: [
        { name: "name", label: "分享昵称", placeholder: "例如：Leo", required: true },
        { name: "channel", label: "分享渠道", as: "select", required: true, options: ["朋友圈", "私域群", "发给好友"] },
      ],
    },
    consult: {
      success: "深度咨询入口已提交，顾问会继续解读本次结果。",
      consent: "同意使用昵称、联系方式和本次测算结果用于顾问回访。",
      fields: [
        { name: "name", label: "称呼", placeholder: "例如：Leo", required: true },
        { name: "phone", label: "联系方式", type: "tel", placeholder: "手机号 / 微信号", required: true },
        { name: "topic", label: "关注方向", as: "select", required: true, options: ["事业", "感情", "财富", "综合"] },
      ],
    },
  },
};

export function App() {
  const standalonePageId = import.meta.env.VITE_PAGE_ID;
  const standalonePage = servicePages.find((page) => page.id === standalonePageId);

  if (standalonePage) {
    return <ServicePage page={standalonePage} standalone />;
  }

  const pagesByRoute = useMemo(
    () => new Map(servicePages.map((page) => [page.route, page])),
    [],
  );
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  const page = pagesByRoute.get(currentPath);

  if (!page) {
    return <Directory pages={servicePages} />;
  }

  return <ServicePage page={page} />;
}

function Directory({ pages }) {
  return (
    <main className="directory-page">
      <section className="directory-shell">
        <p className="eyebrow">AI行业服务工具</p>
        <h1>三个独立手机端项目</h1>
        <p className="directory-copy">每个入口都是一套独立 H5 工具页，可单独打开、演示和点击。</p>
        <div className="directory-grid">
          {pages.map((page) => (
            <a className={`directory-card theme-${page.theme}`} href={page.route} key={page.id}>
              <span>{page.title}</span>
              <strong>{page.toolName}</strong>
              <p>{page.subtitle}</p>
              <ChevronRight size={22} />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

function ServicePage({ page, standalone = false }) {
  const [query, setQuery] = useState(page.defaultQuestion ?? "");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [activeQuick, setActiveQuick] = useState(0);
  const [activeStep, setActiveStep] = useState(1);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(65);
  const [spinning, setSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [fortuneIndex, setFortuneIndex] = useState(0);

  useEffect(() => {
    if (!scanning) return undefined;

    const timer = window.setTimeout(() => {
      setScanning(false);
      setScanProgress(92);
      setNotice("面部扫描完成，完整报告已更新。");
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [scanning]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const fortuneList =
    page.id === "divination" ? [...(page.fortunes ?? []), ...extraDivinationFortunes] : (page.fortunes ?? []);
  const activeFortune = fortuneList[fortuneIndex % fortuneList.length];

  function runAction(actionId) {
    const action = page.actions.find((item) => item.id === actionId);
    if (!action) return;

    if (page.id === "beauty" && actionId === "scan") {
      setScanProgress(65);
      setScanning(true);
      setNotice(action.detail);
      return;
    }

    if (page.id === "divination" && actionId === "spin") {
      if (spinning) return;
      setSpinning(true);
      setNotice(action.detail);
      setSpinAngle((angle) => angle + 720 + (1 + Math.floor(Math.random() * 12)) * 30);
      window.setTimeout(() => {
        setFortuneIndex((value) => {
          if (fortuneList.length <= 1) return value;
          const current = value % fortuneList.length;
          const offset = 1 + Math.floor(Math.random() * (fortuneList.length - 1));
          return (current + offset) % fortuneList.length;
        });
        setSpinning(false);
      }, 920);
      return;
    }

    if (page.id === "legal" && actionId === "ask") {
      setNotice(query.trim() ? action.detail : "请先输入咨询问题。");
      return;
    }

    const conversion = conversionFields[page.id]?.[actionId];

    setModal({
      title: action.label,
      body: action.detail,
      button: actionId === "booking" ? "确认预约" : "确认提交",
      fields: conversion?.fields ?? [],
      consent: conversion?.consent ?? "",
      success: conversion?.success ?? `${action.label}已提交。`,
    });
  }

  function handleQuickAction(item, index) {
    setActiveQuick(index);
    if (page.id === "legal" && item.seed) setQuery(item.seed);
    setNotice(`${item.label}已选中，页面已切换到对应服务入口。`);
  }

  function handleStep(index) {
    setActiveStep(index);
    setNotice(`${page.flowSteps[index].title}：${page.flowSteps[index].caption}`);
  }

  return (
    <main className={`service-page theme-${page.theme}${standalone ? " service-standalone" : ""}`}>
      <a className="back-link" href="/" aria-label="返回项目入口">
        三项目入口
      </a>
      <section className="phone-stage">
        <div className="phone-frame">
          <div className="phone-screen with-bottom-nav">
            <StatusBar light={page.id === "beauty"} />
            {page.id === "legal" && activeTab === 0 && (
              <LegalTool
                page={page}
                query={query}
                setQuery={setQuery}
                activeQuick={activeQuick}
                activeStep={activeStep}
                handleQuickAction={handleQuickAction}
                handleStep={handleStep}
                runAction={runAction}
              />
            )}
            {page.id === "legal" && activeTab === 1 && <LegalCasesPage runAction={runAction} />}
            {page.id === "legal" && activeTab === 2 && <LegalProfilePage runAction={runAction} />}
            {page.id === "beauty" && activeTab === 0 && (
              <BeautyTool
                page={page}
                activeQuick={activeQuick}
                handleQuickAction={handleQuickAction}
                progress={scanProgress}
                scanning={scanning}
                runAction={runAction}
              />
            )}
            {page.id === "beauty" && activeTab === 1 && <BeautyReportPage page={page} runAction={runAction} />}
            {page.id === "beauty" && activeTab === 2 && <BeautyAdvisorPage runAction={runAction} />}
            {page.id === "divination" && activeTab === 0 && (
              <DivinationTool
                page={page}
                activeFortune={activeFortune}
                activeQuick={activeQuick}
                activeStep={activeStep}
                handleQuickAction={handleQuickAction}
                handleStep={handleStep}
                spinning={spinning}
                spinAngle={spinAngle}
                runAction={runAction}
              />
            )}
            {page.id === "divination" && activeTab === 1 && <DivinationHistoryPage runAction={runAction} />}
            {page.id === "divination" && activeTab === 2 && <DivinationProfilePage runAction={runAction} />}
            <BottomNav tabs={page.tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
      </section>

      {notice && <div className="toast">{notice}</div>}
      {modal && (
        <Modal
          modal={modal}
          onClose={() => setModal(null)}
          onSubmit={(message) => {
            setModal(null);
            setNotice(message);
          }}
        />
      )}
    </main>
  );
}

function StatusBar({ light = false }) {
  return (
    <div className={`status-bar ${light ? "light" : ""}`}>
      <span>10:09</span>
      <span>5G</span>
      <span>88%</span>
    </div>
  );
}

function LegalTool({
  page,
  query,
  setQuery,
  activeQuick,
  activeStep,
  handleQuickAction,
  handleStep,
  runAction,
}) {
  return (
    <section className="app-screen legal-screen">
      <AppHeader title={page.toolName} subtitle="专业 · 可靠 · 值得信赖" dark />

      <article className="assistant-card">
        <div>
          <strong>{page.intro.split("。")[0]}。</strong>
          <p>{page.intro.split("。").slice(1).join("。")}</p>
        </div>
        <LegalAssistantVisual />
      </article>

      <SectionTitle title="热门问题" action="换一换" onClick={() => runAction("ask")} />
      <div className="quick-grid legal-quick">
        {page.quickActions.map((item, index) => (
          <QuickButton
            active={index === activeQuick}
            item={item}
            key={item.label}
            onClick={() => handleQuickAction(item, index)}
          />
        ))}
      </div>

      <label className="question-box">
        <span>请描述您的问题，AI为您初步分析</span>
        <textarea value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" onClick={() => runAction("ask")} aria-label="发送问题">
          <Send size={19} />
        </button>
      </label>

      <ResultPanel result={page.result} runAction={runAction} />
      <FlowStrip steps={page.flowSteps} activeStep={activeStep} handleStep={handleStep} />

      <div className="phone-actions sticky-actions">
        <button className="primary" onClick={() => runAction("lawyer")} type="button">
          {page.primaryCta}
          <small>一对一沟通</small>
        </button>
        <button className="secondary" onClick={() => runAction("booking")} type="button">
          {page.secondaryCta}
          <small>线下 / 视频面谈</small>
        </button>
      </div>
    </section>
  );
}

function BeautyTool({ page, activeQuick, handleQuickAction, progress, scanning, runAction }) {
  return (
    <section className="app-screen beauty-screen">
      <AppHeader title={page.toolName} light />

      <div className={`face-card ${scanning ? "is-scanning" : ""}`}>
        <BeautyScanVisual asset={page.asset} scanning={scanning} />
        {page.scanLabels.map((label, index) => (
          <span className={`face-label face-label-${index}`} key={label}>
            {label}
          </span>
        ))}
      </div>

      <div className="scan-state">
        <strong>{scanning ? "AI深度面部扫描中..." : "AI深度面部扫描完成"}</strong>
        <div className="progress-row">
          <span style={{ width: `${progress}%` }} />
          <b>{progress}%</b>
        </div>
        <button className="scan-start-button" onClick={() => runAction("scan")} type="button">
          <ScanFace size={16} />
          {scanning ? "扫描中..." : "点击扫描"}
        </button>
      </div>

      <div className="phone-actions beauty-sticky-actions">
        <button className="primary" onClick={() => runAction("report")} type="button">
          {page.primaryCta}
          <small>发送报告并留资</small>
        </button>
        <button className="secondary" onClick={() => runAction("advisor")} type="button">
          {page.secondaryCta}
          <small>顾问跟进</small>
        </button>
      </div>

      <section className="panel-card">
        <h2>面部问题分析报告</h2>
        <div className="metric-grid">
          {page.metrics.map((item) => (
            <button className={`metric metric-${item.tone}`} key={item.label} type="button">
              <span>{item.label}</span>
              <strong>{item.value}/100</strong>
              <small>★★★★★</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <h2>初步改善建议</h2>
        <div className="quick-grid beauty-quick">
          {page.quickActions.map((item, index) => (
            <QuickButton
              active={index === activeQuick}
              item={item}
              key={item.label}
              onClick={() => handleQuickAction(item, index)}
            />
          ))}
        </div>
      </section>

      <div className="report-list">
        {page.reportHighlights.map((item) => (
          <p key={item}>
            <Sparkles size={14} />
            {item}
          </p>
        ))}
      </div>

      <button className="wide-gradient" onClick={() => runAction("report")} type="button">
        {page.primaryCta}
      </button>
      <button className="link-button" onClick={() => runAction("advisor")} type="button">
        加顾问微信，{page.secondaryCta}
      </button>
      <button className="scan-fab" onClick={() => runAction("scan")} type="button">
        <RotateCw size={16} />
        重新扫描
      </button>
    </section>
  );
}

function BeautyReportPage({ page, runAction }) {
  return (
    <section className="app-screen beauty-screen tab-page beauty-tab-page">
      <AppHeader title="面诊报告" subtitle="肤质评估 · 护理建议" light />

      <article className="tab-hero beauty-tab-hero">
        <ScanFace size={22} />
        <div>
          <strong>AI 面诊已完成</strong>
          <p>综合分 92%，当前适合先做屏障稳定与补水修护，再进入进阶管理。</p>
        </div>
      </article>

      <section className="panel-card">
        <h2>核心指标</h2>
        <div className="metric-grid">
          {page.metrics.map((item) => (
            <button className={`metric metric-${item.tone}`} key={item.label} type="button">
              <span>{item.label}</span>
              <strong>{item.value}/100</strong>
              <small>AI 评估</small>
            </button>
          ))}
        </div>
      </section>

      <div className="tab-list">
        {beautyReportItems.map(([title, value, note]) => (
          <article className="tab-card beauty-tab-card compact-card" key={title}>
            <div className="tab-card-head">
              <span>{title}</span>
              <b>{value}</b>
            </div>
            <p>{note}</p>
          </article>
        ))}
      </div>

      <div className="tab-actions">
        <button className="primary beauty-primary" onClick={() => runAction("report")} type="button">
          领取完整报告
        </button>
        <button className="secondary beauty-secondary" onClick={() => runAction("advisor")} type="button">
          获取方案
        </button>
      </div>
    </section>
  );
}

function BeautyAdvisorPage({ runAction }) {
  return (
    <section className="app-screen beauty-screen tab-page beauty-tab-page">
      <AppHeader title="专属顾问" subtitle="方案 · 预约 · 跟进" light />

      <article className="tab-hero beauty-tab-hero advisor-hero">
        <Headphones size={22} />
        <div>
          <strong>顾问方案待确认</strong>
          <p>可补充预算、到店时间和主要改善目标，顾问会给到护理组合和周期建议。</p>
        </div>
      </article>

      <div className="tab-list">
        {beautyAdvisorItems.map(([title, value, note]) => (
          <article className="tab-card beauty-tab-card compact-card" key={title}>
            <div className="tab-card-head">
              <span>{title}</span>
              <b>{value}</b>
            </div>
            <p>{note}</p>
          </article>
        ))}
      </div>

      <div className="tab-checklist beauty-checklist">
        {["确认皮肤目标", "选择预算范围", "预约到店检测"].map((item) => (
          <span key={item}>
            <BadgeCheck size={15} />
            {item}
          </span>
        ))}
      </div>

      <div className="tab-actions">
        <button className="primary beauty-primary" onClick={() => runAction("advisor")} type="button">
          提交顾问需求
        </button>
        <button className="secondary beauty-secondary" onClick={() => runAction("report")} type="button">
          查看报告
        </button>
      </div>
    </section>
  );
}

function DivinationTool({
  page,
  activeFortune,
  activeQuick,
  activeStep,
  handleQuickAction,
  handleStep,
  spinning,
  spinAngle,
  runAction,
}) {
  return (
    <section className="app-screen divination-screen">
      <header className="mystic-header">
        <div className="avatar-moon">
          <MoonStar size={25} />
        </div>
        <div>
          <strong>姓名：{page.userName}</strong>
          <span>{page.userName}</span>
        </div>
        <Settings size={20} />
      </header>

      <button
        aria-label="点击转动"
        className={`wheel-button ${spinning ? "is-spinning" : ""}`}
        onClick={() => runAction("spin")}
        type="button"
      >
              <DivinationWheelVisual spinAngle={spinAngle} />
      </button>

      <article className="fortune-card">
        <div className="fortune-title">
          <span>{activeFortune.title}</span>
          <strong>{activeFortune.score}分</strong>
        </div>
        {activeFortune.items.map(([label, text]) => (
          <p key={label}>
            <Gem size={15} />
            <strong>{label}</strong>
            <span>{text}</span>
          </p>
        ))}
      </article>

      <div className="quick-grid mystic-quick">
        {page.quickActions.map((item, index) => (
          <QuickButton
            active={index === activeQuick}
            item={item}
            key={item.label}
            onClick={() => handleQuickAction(item, index)}
          />
        ))}
      </div>

      <FlowStrip steps={page.flowSteps} activeStep={activeStep} handleStep={handleStep} compact />

      <button className="link-button warm-link" onClick={() => runAction("consult")} type="button">
        深度咨询
      </button>
      <div className="phone-actions divination-actions sticky-actions">
        <button className="secondary" onClick={() => runAction("spin")} type="button">
          {page.primaryCta}
        </button>
        <button className="primary warm" onClick={() => runAction("share")} type="button">
          {page.secondaryCta}
        </button>
      </div>
    </section>
  );
}

function LegalCasesPage({ runAction }) {
  return (
    <section className="app-screen legal-screen tab-page">
      <AppHeader title="案例中心" subtitle="类案参考 · 处理路径" dark />
      <article className="tab-hero">
        <FileText size={22} />
        <div>
          <strong>常见法律问题案例库</strong>
          <p>按问题类型、证据状态和下一步动作整理，方便用户对照自己的情况。</p>
        </div>
      </article>

      <div className="tab-list">
        {legalCases.map((item) => (
          <article className="tab-card" key={item.title}>
            <div className="tab-card-head">
              <span>{item.type}</span>
              <b>{item.status}</b>
            </div>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
            <small>{item.result}</small>
          </article>
        ))}
      </div>

      <div className="tab-actions">
        <button className="primary" onClick={() => runAction("lawyer")} type="button">
          咨询同类问题
        </button>
        <button className="secondary" onClick={() => runAction("booking")} type="button">
          预约面谈
        </button>
      </div>
    </section>
  );
}

function LegalProfilePage({ runAction }) {
  return (
    <section className="app-screen legal-screen tab-page">
      <AppHeader title="我的法律服务" subtitle="咨询 · 材料 · 预约" dark />
      <article className="tab-hero profile-hero">
        <User size={22} />
        <div>
          <strong>王女士</strong>
          <p>当前阶段：证据整理中。建议先补充聊天记录和最近一次催款记录。</p>
        </div>
      </article>

      <div className="tab-list">
        {legalProfileItems.map(([title, value, note]) => (
          <article className="tab-card compact-card" key={title}>
            <div className="tab-card-head">
              <span>{title}</span>
              <b>{value}</b>
            </div>
            <p>{note}</p>
          </article>
        ))}
      </div>

      <div className="tab-checklist">
        {["确认诉求金额", "补齐证据材料", "等待律师回访"].map((item) => (
          <span key={item}>
            <BadgeCheck size={15} />
            {item}
          </span>
        ))}
      </div>

      <div className="tab-actions">
        <button className="primary" onClick={() => runAction("lawyer")} type="button">
          继续咨询
        </button>
        <button className="secondary" onClick={() => runAction("booking")} type="button">
          查看预约
        </button>
      </div>
    </section>
  );
}

function DivinationHistoryPage({ runAction }) {
  return (
    <section className="app-screen divination-screen tab-page">
      <header className="mystic-header">
        <div className="avatar-moon">
          <MoonStar size={25} />
        </div>
        <div>
          <strong>历史测算</strong>
          <span>最近 3 次结果</span>
        </div>
        <Settings size={20} />
      </header>

      <div className="tab-list">
        {divinationHistory.map((item) => (
          <article className="tab-card history-card" key={item.date}>
            <div className="tab-card-head">
              <span>{item.date}</span>
              <b>{item.score}</b>
            </div>
            <h3>{item.title}</h3>
            <p>{item.note}</p>
            <small>关注方向：{item.focus}</small>
          </article>
        ))}
      </div>

      <div className="tab-actions">
        <button className="secondary" onClick={() => runAction("spin")} type="button">
          再测一次
        </button>
        <button className="primary warm" onClick={() => runAction("consult")} type="button">
          深度咨询
        </button>
      </div>
    </section>
  );
}

function DivinationProfilePage({ runAction }) {
  return (
    <section className="app-screen divination-screen tab-page">
      <header className="mystic-header">
        <div className="avatar-moon">
          <User size={24} />
        </div>
        <div>
          <strong>我的国学档案</strong>
          <span>Explorer Leo</span>
        </div>
        <Settings size={20} />
      </header>

      <article className="tab-hero warm-hero">
        <Gem size={22} />
        <div>
          <strong>专属偏好已保存</strong>
          <p>重点关注事业、财富和关系沟通，后续解读会结合历史结果。</p>
        </div>
      </article>

      <div className="tab-list">
        {divinationProfileItems.map(([title, value, note]) => (
          <article className="tab-card compact-card" key={title}>
            <div className="tab-card-head">
              <span>{title}</span>
              <b>{value}</b>
            </div>
            <p>{note}</p>
          </article>
        ))}
      </div>

      <div className="tab-actions">
        <button className="secondary" onClick={() => runAction("share")} type="button">
          分享结果
        </button>
        <button className="primary warm" onClick={() => runAction("consult")} type="button">
          联系顾问
        </button>
      </div>
    </section>
  );
}

function AppHeader({ title, subtitle, light = false }) {
  return (
    <header className={`app-header ${light ? "light" : ""}`}>
      <Sparkles size={18} />
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <Info size={19} />
      <Settings size={19} />
    </header>
  );
}

function LegalAssistantVisual() {
  return (
    <div className="legal-assistant-visual" aria-hidden="true">
      <div className="assistant-halo" />
      <div className="assistant-bot">
        <span className="bot-eye" />
        <span className="bot-eye" />
      </div>
      <span className="bot-pulse" />
    </div>
  );
}

function BeautyScanVisual({ asset, scanning }) {
  return (
    <div className="beauty-scan-visual" aria-hidden="true">
      <img className="scan-art" src={asset} alt="" />
      <span className={`scan-beam ${scanning ? "active" : ""}`} />
      <span className="scan-glass" />
    </div>
  );
}

const zodiacSlots = [
  ["子", "鼠"],
  ["丑", "牛"],
  ["寅", "虎"],
  ["卯", "兔"],
  ["辰", "龙"],
  ["巳", "蛇"],
  ["午", "马"],
  ["未", "羊"],
  ["申", "猴"],
  ["酉", "鸡"],
  ["戌", "狗"],
  ["亥", "猪"],
];

const fixedZodiacSlots = [
  { branch: "\u5b50", symbol: "\ud83d\udc00" },
  { branch: "\u4e11", symbol: "\ud83d\udc02" },
  { branch: "\u5bc5", symbol: "\ud83d\udc05" },
  { branch: "\u536f", symbol: "\ud83d\udc07" },
  { branch: "\u8fb0", symbol: "\ud83d\udc09" },
  { branch: "\u5df3", symbol: "\ud83d\udc0d" },
  { branch: "\u5348", symbol: "\ud83d\udc0e" },
  { branch: "\u672a", symbol: "\ud83d\udc10" },
  { branch: "\u7533", symbol: "\ud83d\udc12" },
  { branch: "\u9149", symbol: "\ud83d\udc13" },
  { branch: "\u620c", symbol: "\ud83d\udc15" },
  { branch: "\u4ea5", symbol: "\ud83d\udc16" },
];

function polarPoint(radius, angle) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: 500 + Math.sin(rad) * radius,
    y: 500 - Math.cos(rad) * radius,
  };
}

function sectorPath(index, innerRadius = 185, outerRadius = 438) {
  const center = index * 30;
  const start = center - 15;
  const end = center + 15;
  const outerStart = polarPoint(outerRadius, start);
  const outerEnd = polarPoint(outerRadius, end);
  const innerEnd = polarPoint(innerRadius, end);
  const innerStart = polarPoint(innerRadius, start);

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function ZodiacAnimal({ type }) {
  const common = {
    fill: "url(#zodiacAnimalGold)",
    stroke: "#6b3e12",
    strokeWidth: 6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    filter: "url(#animalGlow)",
  };
  const eye = <circle cx="26" cy="-14" r="3.4" fill="#3b1d07" stroke="none" />;

  switch (type) {
    case "rat":
      return (
        <g {...common}>
          <ellipse cx="-6" cy="12" rx="34" ry="20" />
          <circle cx="29" cy="-2" r="15" />
          <circle cx="34" cy="-19" r="8" />
          <path d="M-38 11 C-67 18 -69 -12 -43 -13" fill="none" />
          <path d="M-22 31 L-33 45 M5 31 L6 47" fill="none" />
          {eye}
        </g>
      );
    case "ox":
      return (
        <g {...common}>
          <ellipse cx="-10" cy="10" rx="43" ry="23" />
          <circle cx="34" cy="-1" r="18" />
          <path d="M24 -18 C4 -42 39 -48 37 -20 M42 -18 C65 -41 69 -10 48 -8" fill="none" />
          <path d="M-44 3 C-58 -9 -54 -25 -38 -17 M-29 30 L-38 50 M0 31 L-3 51 M28 25 L38 46" fill="none" />
          {eye}
        </g>
      );
    case "tiger":
      return (
        <g {...common}>
          <ellipse cx="-8" cy="10" rx="42" ry="22" />
          <circle cx="36" cy="-4" r="18" />
          <path d="M-39 0 C-58 -13 -50 -30 -34 -18 M-27 -5 L-17 21 M-8 -10 L2 22 M12 -8 L20 17" fill="none" />
          <path d="M28 -23 L36 -39 L44 -22 M-28 29 L-38 50 M2 30 L-2 51 M29 23 L41 43" fill="none" />
          {eye}
        </g>
      );
    case "rabbit":
      return (
        <g {...common}>
          <ellipse cx="-10" cy="14" rx="36" ry="20" />
          <circle cx="29" cy="-1" r="17" />
          <path d="M22 -15 C5 -52 24 -60 34 -18 M38 -14 C48 -55 66 -44 48 -9" fill="none" />
          <path d="M-39 10 C-54 0 -50 -17 -34 -10 M-22 31 L-31 48 M7 32 L10 48" fill="none" />
          {eye}
        </g>
      );
    case "snake":
      return (
        <g {...common} fill="none">
          <path d="M-39 32 C-8 55 40 42 27 7 C18 -18 -24 -4 -8 -35 C5 -58 56 -43 48 -4 C42 25 7 26 0 7" />
          <path d="M40 -18 L60 -28 M43 -16 L61 -9" />
          <circle cx="43" cy="-24" r="3.4" fill="#3b1d07" stroke="none" />
        </g>
      );
    case "horse":
      return (
        <g {...common}>
          <ellipse cx="-8" cy="7" rx="42" ry="21" />
          <path d="M20 -5 C30 -43 61 -38 50 -6 C45 8 35 12 23 10 Z" />
          <path d="M28 -28 C19 -21 17 -8 23 5 M-40 0 C-56 -10 -52 -25 -37 -18" fill="none" />
          <path d="M-28 26 L-42 52 M-2 27 L-4 53 M22 24 L34 50 M37 14 L49 39" fill="none" />
          {eye}
        </g>
      );
    case "goat":
      return (
        <g {...common}>
          <ellipse cx="-8" cy="9" rx="40" ry="23" />
          <circle cx="35" cy="-4" r="17" />
          <path d="M27 -16 C6 -44 29 -56 39 -22 M41 -16 C67 -42 64 -12 48 -4" fill="none" />
          <path d="M51 6 L59 23 M-35 4 C-54 -11 -48 -27 -33 -15" fill="none" />
          <path d="M-26 28 L-36 49 M3 29 L0 51 M28 24 L39 45" fill="none" />
          <circle cx="-28" cy="-1" r="8" /><circle cx="-7" cy="-5" r="9" /><circle cx="12" cy="1" r="8" />
          {eye}
        </g>
      );
    case "monkey":
      return (
        <g {...common}>
          <ellipse cx="-9" cy="12" rx="32" ry="24" />
          <circle cx="24" cy="-5" r="19" />
          <circle cx="43" cy="-4" r="8" /><circle cx="10" cy="-5" r="8" />
          <path d="M-35 9 C-60 -19 -26 -46 -12 -24 M-17 31 L-25 49 M7 31 L2 50 M29 11 C47 27 40 45 20 35" fill="none" />
          <circle cx="18" cy="-9" r="3" fill="#3b1d07" stroke="none" />
          <circle cx="30" cy="-9" r="3" fill="#3b1d07" stroke="none" />
        </g>
      );
    case "dragon":
      return (
        <g {...common} fill="none">
          <path d="M-48 20 C-23 -36 15 34 45 -19 C56 -38 74 -21 54 -2 C38 13 12 5 -3 24 C-20 46 -49 38 -48 20" />
          <path d="M37 -25 L31 -48 M48 -23 L61 -44 M49 -8 L73 -4 M-23 -5 L-43 -24 M-5 15 L-24 36" />
          <circle cx="47" cy="-16" r="3.6" fill="#3b1d07" stroke="none" />
        </g>
      );
    case "rooster":
      return (
        <g {...common}>
          <ellipse cx="-8" cy="12" rx="33" ry="20" />
          <circle cx="27" cy="-3" r="16" />
          <path d="M34 -18 C29 -38 44 -36 41 -18 M43 -14 C57 -29 61 -7 44 -5 M-37 0 C-56 -27 -20 -32 -12 -10" fill="none" />
          <path d="M-17 31 L-24 50 M8 31 L13 50 M38 2 L55 7" fill="none" />
          {eye}
        </g>
      );
    case "dog":
      return (
        <g {...common}>
          <ellipse cx="-8" cy="10" rx="40" ry="22" />
          <circle cx="35" cy="-4" r="18" />
          <path d="M23 -18 C5 -37 19 -48 35 -22 M45 -14 C67 -31 61 -2 47 4" fill="none" />
          <path d="M-39 1 C-58 -9 -52 -27 -35 -16 M-27 29 L-36 50 M0 30 L-3 51 M28 24 L39 45" fill="none" />
          {eye}
        </g>
      );
    case "pig":
      return (
        <g {...common}>
          <ellipse cx="-8" cy="11" rx="42" ry="24" />
          <circle cx="35" cy="-3" r="18" />
          <ellipse cx="48" cy="2" rx="10" ry="7" />
          <path d="M23 -16 L13 -35 M43 -18 L56 -33 M-43 4 C-59 -8 -52 -25 -35 -16" fill="none" />
          <path d="M-27 31 L-35 50 M2 32 L0 51 M28 26 L39 46" fill="none" />
          {eye}
        </g>
      );
    default:
      return (
        <g {...common}>
          <ellipse cx="-8" cy="9" rx="40" ry="22" />
          <circle cx="34" cy="-4" r="17" />
          <path d="M-40 2 C-58 -13 -50 -31 -34 -17" fill="none" />
          <path d="M-28 28 L-38 50 M1 29 L-3 51 M28 24 L39 45" fill="none" />
          {eye}
        </g>
      );
  }
}

function ZodiacWheelSvg({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 1000 1000" role="img" aria-label="12生肖转盘">
      <defs>
        <radialGradient id="wheelBg" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#102c72" />
          <stop offset="58%" stopColor="#061844" />
          <stop offset="100%" stopColor="#020612" />
        </radialGradient>
        <linearGradient id="sectorBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#11275a" stopOpacity="0.72" />
          <stop offset="48%" stopColor="#071737" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#020815" stopOpacity="0.88" />
        </linearGradient>
        <linearGradient id="zodiacGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6dfaa" />
          <stop offset="45%" stopColor="#c28a42" />
          <stop offset="100%" stopColor="#6d421a" />
        </linearGradient>
        <linearGradient id="zodiacAnimalGold" x1="-20%" y1="-20%" x2="110%" y2="110%">
          <stop offset="0%" stopColor="#fff4c8" />
          <stop offset="40%" stopColor="#d7a04b" />
          <stop offset="72%" stopColor="#9d621f" />
          <stop offset="100%" stopColor="#4e2709" />
        </linearGradient>
        <filter id="animalGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#05070f" floodOpacity="0.75" />
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#f4c46c" floodOpacity="0.45" />
        </filter>
        <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#f3bf67" floodOpacity="0.5" />
        </filter>
      </defs>
      <rect width="1000" height="1000" fill="url(#wheelBg)" opacity="0.28" />
      <g opacity="0.72" stroke="#d7b36b" strokeWidth="1.4" fill="#ffe7a6">
        <circle cx="105" cy="150" r="3" /><circle cx="210" cy="92" r="2.4" /><circle cx="790" cy="120" r="3" />
        <circle cx="890" cy="242" r="2.2" /><circle cx="145" cy="826" r="2.4" /><circle cx="820" cy="842" r="3" />
        <path d="M105 150 210 92 312 150M724 96 790 120 890 242M145 826 250 756 360 820M690 800 820 842 910 772" fill="none" />
      </g>
      <circle cx="500" cy="500" r="456" fill="none" stroke="url(#zodiacGold)" strokeWidth="5" filter="url(#goldGlow)" />
      <circle cx="500" cy="500" r="428" fill="none" stroke="#315baf" strokeWidth="7" opacity="0.48" />
      <circle cx="500" cy="500" r="408" fill="none" stroke="url(#zodiacGold)" strokeWidth="2.5" opacity="0.78" />
      {fixedZodiacSlots.map((slot, index) => {
        const label = polarPoint(326, index * 30);
        const animal = polarPoint(258, index * 30);
        return (
          <g key={slot.branch}>
            <path className="zodiac-sector" d={sectorPath(index, 188, 392)} fill="url(#sectorBlue)" stroke="url(#zodiacGold)" strokeWidth="3" opacity="0.92" />
            <text className="zodiac-branch" x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fill="url(#zodiacGold)" fontSize="62" fontWeight="900" fontFamily="Microsoft YaHei, PingFang SC, serif" filter="url(#goldGlow)">
              {slot.branch}
            </text>
            <text className="zodiac-symbol" x={animal.x} y={animal.y} textAnchor="middle" dominantBaseline="middle" fontSize="43">
              {slot.symbol}
            </text>
          </g>
        );
      })}
      <circle cx="500" cy="500" r="392" fill="none" stroke="url(#zodiacGold)" strokeWidth="5" opacity="0.88" />
      <circle cx="500" cy="500" r="366" fill="none" stroke="#315baf" strokeWidth="4" opacity="0.46" />
      <circle cx="500" cy="500" r="296" fill="none" stroke="url(#zodiacGold)" strokeWidth="3.5" opacity="0.72" />
      <circle cx="500" cy="500" r="212" fill="none" stroke="#315baf" strokeWidth="3.5" opacity="0.38" />
      <circle cx="500" cy="500" r="145" fill="#0a1533" stroke="url(#zodiacGold)" strokeWidth="5" opacity="0.92" filter="url(#goldGlow)" />
      <circle cx="500" cy="500" r="96" fill="#040a1b" stroke="#2f5aa8" strokeWidth="5" opacity="0.82" />
      <path d="M500 62 518 101 500 140 482 101Z M938 500 899 518 860 500 899 482Z M500 938 518 899 500 860 482 899Z M62 500 101 518 140 500 101 482Z" fill="url(#zodiacGold)" filter="url(#goldGlow)" opacity="0.95" />
    </svg>
  );
}

function DivinationWheelVisual({ spinAngle }) {
  return (
    <div className="divination-wheel-visual" aria-hidden="true">
      <div className="wheel-disc">
        <div className="wheel-rotor" style={{ "--spin-angle": `${spinAngle}deg` }}>
          <ZodiacWheelSvg className="wheel-art wheel-svg-art wheel-asset-primary" />
        </div>
      </div>
      <div className="wheel-result-pointer" />
      <div className="wheel-center-label">
        <strong>点击转动</strong>
      </div>
    </div>
  );
}

function SectionTitle({ title, action, onClick }) {
  return (
    <div className="section-title">
      <span>{title}</span>
      <button type="button" onClick={onClick}>
        {action}
      </button>
    </div>
  );
}

function QuickButton({ item, active, onClick }) {
  const Icon = icons[item.icon] ?? Sparkles;

  return (
    <button className={active ? "is-active" : ""} onClick={onClick} type="button">
      <Icon size={19} />
      <span>{item.label}</span>
      <small>{item.caption}</small>
    </button>
  );
}

function ResultPanel({ result, runAction }) {
  return (
    <article className="result-panel">
      <div>
        <strong>{result.title}</strong>
        <button type="button" onClick={() => runAction("detail")}>
          查看详情
        </button>
      </div>
      {result.rows.map(([label, value]) => (
        <p key={label}>
          <span>{label}</span>
          <b>{value}</b>
        </p>
      ))}
    </article>
  );
}

function FlowStrip({ steps, activeStep, handleStep, compact = false }) {
  return (
    <section className={`journey-strip ${compact ? "compact" : ""}`} aria-label="服务流程">
      {steps.map((step, index) => {
        const Icon = icons[step.icon] ?? Sparkles;
        return (
          <button
            className={index === activeStep ? "is-active" : ""}
            key={step.title}
            onClick={() => handleStep(index)}
            type="button"
          >
            <Icon size={18} />
            <span>{step.title}</span>
            <small>{step.caption}</small>
          </button>
        );
      })}
    </section>
  );
}

function BottomNav({ tabs, activeTab, setActiveTab }) {
  const navIcons = [Home, FileText, User];

  return (
    <nav className="bottom-nav" aria-label="底部导航">
      {tabs.map((tab, index) => {
        const Icon = navIcons[index] ?? Home;
        return (
          <button
            className={activeTab === index ? "active" : ""}
            key={tab}
            onClick={() => setActiveTab(index)}
            type="button"
          >
            <Icon size={19} />
            {tab}
          </button>
        );
      })}
    </nav>
  );
}

function Modal({ modal, onClose, onSubmit }) {
  const initialValues = Object.fromEntries((modal.fields ?? []).map((field) => [field.name, ""]));
  const [values, setValues] = useState(initialValues);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const hasFields = modal.fields?.length > 0;

  function updateField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  }

  function submitForm(event) {
    event.preventDefault();
    if (hasFields && modal.fields.some((field) => field.required && !values[field.name]?.trim())) {
      setError("请先补全必填信息。");
      return;
    }
    if (modal.consent && !accepted) {
      setError("请先确认授权说明。");
      return;
    }
    onSubmit(modal.success);
  }

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label={modal.title}>
      <form className="modal-card" onSubmit={submitForm}>
        <button className="modal-close" onClick={onClose} type="button" aria-label="关闭">
          <X size={18} />
        </button>
        <CalendarCheck size={34} />
        <h2>{modal.title}</h2>
        <p>{modal.body}</p>
        {hasFields && (
          <div className="modal-form">
            {modal.fields.map((field) => (
              <label className="field-row" key={field.name}>
                <span>
                  {field.label}
                  {field.required && <b>*</b>}
                </span>
                {field.as === "textarea" ? (
                  <textarea
                    onChange={(event) => updateField(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    value={values[field.name]}
                  />
                ) : field.as === "select" ? (
                  <select
                    onChange={(event) => updateField(field.name, event.target.value)}
                    value={values[field.name]}
                  >
                    <option value="">请选择</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    onChange={(event) => updateField(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    type={field.type ?? "text"}
                    value={values[field.name]}
                  />
                )}
              </label>
            ))}
          </div>
        )}
        {modal.consent && (
          <label className="modal-consent">
            <input checked={accepted} onChange={(event) => setAccepted(event.target.checked)} type="checkbox" />
            <span>{modal.consent}</span>
          </label>
        )}
        {error && <strong className="modal-error">{error}</strong>}
        <button type="submit">
          {modal.button}
        </button>
      </form>
    </div>
  );
}
