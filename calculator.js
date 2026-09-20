// ============================================================
// THE NOTE DISSEMINATION CALCULATOR — works/theory-03.html
//
// The theory's own arithmetic, done for you. The owner wrote the
// piece, worked three examples by hand in it, and then asked for the
// same working automated "for the people that want to try it out".
//
// IT IS NOT ANOTHER PAGE, and that is deliberate: "it doesnt have to
// be a new page, just as long as it feels like one... the stars in the
// background should remain where they are and on screen." A second
// page would throw the field away and roll a different one. So the
// calculator stands in the SAME page as the theory, the reading fades
// out, the calculator fades in, and `essay.js` goes on drawing behind
// both of them without being told anything at all.
//
// WHAT IT DOES. Three models, which are the theory's own three:
//
//   DEFAULT IBR        IBR = IC/BC. One reading, no direction, no
//                      complexity.
//   MODIFIED (VAR. 1)  ±IBR = IC/BC × 10/n, worked three times — top,
//                      mid and dry down — with one n for the whole
//                      fragrance.
//   MODIFIED (VAR. 2)  ±IBR = IC/BC × x/n, the same three times, but n
//                      is the notes at THAT stage and x is the whole
//                      fragrance's count.
//
// Every one of them draws its own diagram as you type: a circle, and a
// note for every n, standing IC% outside it. That is the theory's own
// picture, and having it answer the numbers is most of the point of
// automating them.
//
// THE SIGN IS NOT PART OF THE ARITHMETIC. It says which way the notes
// are going (complication 1) and is written in front of the answer;
// every comparison with a threshold is made on the ABSOLUTE value,
// which is what the bars in the readings mean.
//
// WITHOUT THIS SCRIPT the button that opens it does nothing and the
// theory is unharmed — the calculator's own markup is built here, so
// there is nothing of it in the page to be left stranded.
// ============================================================
(function () {
  const page = document.querySelector(".essay-page");
  const enter = document.getElementById("calc-enter");
  if (!page || !enter) return;

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ============================================================
  // THE WORDS
  //
  // Kept here rather than in the markup because every one of them is
  // said in two places — the term in the equation and the readout under
  // it — and two copies of a sentence is one copy too many.
  // ============================================================
  const SAYS = {
    IBR: "IBR is the Individual to Blended Ratio; it expresses the proportion of Individual Character a person has relative to its Blended Character.",
    IC: "IC is the Individual Character, which is a percentage of how easy it is to tell the notes apart in a given fragrance.",
    BC: "BC: Blended Character, which is a percentage of how difficult it is to tell the notes apart in a given fragrance.",
    TEN: "10: 10 is an arbitrary number chosen based on the assumption that any fragrance below 10 notes is seldom complicated.",
    N1: "n: n is the number of total notes present in a fragrance.",
    N2: "n: n is the number of notes present in a fragrance at either the top, mid or base.",
    X: "x: x is the total notes in the fragrance; corresponding to the maximum theoretical complexity.",
    SIGN: "+/−: + is when the notes become more recognizable as the fragrance progresses; − is when the notes become more obscure as the fragrance progresses.",
  };

  const C3 =
    "<h3>Complication 3</h3>" +
    "<p>The third complication is essentially doing everything mentioned above thrice for every fragrance: once for the top, once for the middle, and once for the dry down. The way to do this depends.</p>" +
    "<p>The first way I thought of is by keeping everything the same essentially; except for the fact that the IC/BC would change depending on where you are in the progression of a perfume.</p>" +
    "<p>The second way I thought of is more nuanced and would replace the <i>n</i> in the modified <i>IBR</i> equation (<i>IBR</i> = (<i>IC</i>/<i>BC</i>) &#215; <i>x</i>/<i>n</i>), where <i>n</i> is the corresponding number of notes within the top, mid and dry down independently; while using the total notes of the fragrance as the nominator, denoted as <i>x</i> (equivalent to the maximum theoretical complexity of the fragrance).</p>";

  const STAGES = ["Top", "Mid", "Dry Down"];

  // ============================================================
  // THE DIAGRAM
  //
  // The theory's own picture, drawn from the numbers rather than from
  // coordinates: a circle, and one note for every n lying on a radius
  // through it, with IC% of its body outside and BC% inside. The head
  // is on whichever end the fragrance is travelling towards — and on
  // the default model there is no head at all, because that model has
  // no direction to show.
  // ============================================================
  const R = 58, L = 52, HEAD_L = 8, HEAD_W = 3.4;

  function zone(n, icPct, heads, label) {
    const side = (R + L) * 2 + 26;
    const c = side / 2;
    const inside = Math.max(0, Math.min(1, 1 - icPct / 100));
    const count = Math.max(1, Math.min(60, Math.round(n) || 1));
    const small = count > 14;
    const hl = small ? 6.5 : HEAD_L, hw = small ? 2.8 : HEAD_W;
    const out = ['<circle class="zone-ring" cx="' + c + '" cy="' + c + '" r="' + R + '"/>'];
    for (let i = 0; i < count; i++) {
      const a = (-90 + (360 * i) / count) * Math.PI / 180;
      const ux = Math.cos(a), uy = Math.sin(a);
      const px = -uy, py = ux;
      const r0 = R - inside * L, r1 = R + (1 - inside) * L;
      const x0 = c + r0 * ux, y0 = c + r0 * uy;
      const x1 = c + r1 * ux, y1 = c + r1 * uy;
      let sx = x0, sy = y0, ex = x1, ey = y1;
      let tip = null, base = null;
      if (heads === "out") { tip = [x1, y1]; base = [x1 - hl * ux, y1 - hl * uy]; ex = base[0]; ey = base[1]; }
      if (heads === "in") { tip = [x0, y0]; base = [x0 + hl * ux, y0 + hl * uy]; sx = base[0]; sy = base[1]; }
      out.push('<line class="zone-arrow" x1="' + sx.toFixed(1) + '" y1="' + sy.toFixed(1) +
               '" x2="' + ex.toFixed(1) + '" y2="' + ey.toFixed(1) + '"/>');
      if (tip) {
        out.push('<polygon class="zone-head" points="' +
          tip[0].toFixed(1) + "," + tip[1].toFixed(1) + " " +
          (base[0] + hw * px).toFixed(1) + "," + (base[1] + hw * py).toFixed(1) + " " +
          (base[0] - hw * px).toFixed(1) + "," + (base[1] - hw * py).toFixed(1) + '"/>');
      }
    }
    return '<figure class="calc-zone-figure">' +
      '<svg class="zone" viewBox="0 0 ' + side + " " + side + '" role="img" aria-label="' +
        (label || "The notes against the zone") + ': ' + Math.round(icPct) + '% of each note outside the zone">' +
        out.join("") + "</svg>" +
      (label ? '<figcaption class="zone-cell-name">' + label + "</figcaption>" : "") +
      "</figure>";
  }

  // ============================================================
  // THE ARITHMETIC
  // ============================================================
  const round = (v, places) => {
    const at = Math.pow(10, places === undefined ? 3 : places);
    return Math.round(v * at) / at;
  };
  const show = (v) => {
    if (!isFinite(v)) return "—";
    const r = round(v, 3);
    return String(r);
  };

  /** Which side of the thresholds a reading falls, asked of its
      ABSOLUTE value: the sign says which way the notes are going, and
      a threshold does not care which way anything is going. */
  function band(v) {
    const a = Math.abs(v);
    if (!isFinite(a)) return null;
    if (a < 0.5) return {
      where: "< 0.5",
      say: "less than the 0.5 threshold. The notes are difficult to distinguish from each other.",
      table: "The notes are difficult to tell apart.",
    };
    if (a <= 2) return {
      where: "between 0.5 and 2",
      say: "between 0.5 and 2. The notes are moderately difficult to distinguish from each other.",
      table: "You can tell apart the notes with moderate difficulty.",
    };
    return {
      where: "> 2",
      say: "more than 2. The notes are relatively easy to distinguish from each other.",
      table: "You can tell the notes apart.",
    };
  }

  const mv = (x) => '<i class="mv">' + x + "</i>";
  const sub = (x) => "<sub>" + x + "</sub>";
  const abs = (x) => '<span class="mabs">&#124;</span>' + x + '<span class="mabs">&#124;</span>';

  /** A term in the big equation, which says what it is when pointed at. */
  const term = (text, key) =>
    '<button class="calc-term" type="button" data-say="' + key + '">' + text + "</button>";

  // ============================================================
  // BUILDING THE CALCULATOR
  // ============================================================
  const calc = document.createElement("section");
  calc.className = "calc";
  calc.id = "calculator";
  calc.hidden = true;
  calc.setAttribute("aria-labelledby", "calc-title");
  calc.innerHTML =
    '<header class="calc-head">' +
      '<p class="essay-kicker">Theories &middot; 03 &middot; Calculator</p>' +
      '<h1 id="calc-title">The Note Dissemination Theory &mdash; Calculator</h1>' +
      '<p class="calc-lede">Here, I have automated the math of the previous page, and provided explanations to go with it. Below, you need to select the model which you want to work with; afterwards, just fill in the numbers and the website should help you out.</p>' +
      '<p class="calc-lede">Do note that I have added a variation for each of the two variations for complication 3. ' +
        '<button class="calc-review" type="button">Press here to review them</button></p>' +
    "</header>" +
    '<div class="calc-models">' +
      '<button class="calc-model" type="button" data-model="plain">Default <i class="mv">IBR</i></button>' +
      '<button class="calc-model" type="button" data-model="v1">Modified <i class="mv">IBR</i> (var. 1)</button>' +
      '<div class="calc-model-wrap">' +
        '<button class="calc-model" type="button" data-model="v2">Modified <i class="mv">IBR</i> (var. 2)</button>' +
        '<p class="calc-caveat" hidden>This variation of the complication is still in the working, and needs to be further test it, so take the results with a grain of salt.</p>' +
      "</div>" +
    "</div>" +
    '<div class="calc-body" hidden></div>' +
    '<footer class="calc-foot">' +
      '<button class="calc-back" type="button">&larr; Back to the theory</button>' +
    "</footer>";
  document.body.appendChild(calc);

  const shell = calc.querySelector(".calc-body");
  const caveat = calc.querySelector(".calc-caveat");

  // The window that reviews complication 3.
  const modal = document.createElement("div");
  modal.className = "calc-modal";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Complication 3");
  modal.innerHTML =
    '<div class="calc-modal-sheet">' + C3 +
      '<button class="calc-modal-shut" type="button">Close</button></div>';
  document.body.appendChild(modal);

  const shutModal = () => { modal.hidden = true; };
  modal.addEventListener("click", (e) => { if (e.target === modal) shutModal(); });
  modal.querySelector(".calc-modal-shut").addEventListener("click", shutModal);
  calc.querySelector(".calc-review").addEventListener("click", () => {
    modal.hidden = false;
    modal.querySelector(".calc-modal-shut").focus();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) { shutModal(); return; }
    if (e.key === "Escape" && !calc.hidden) leave();
  });

  // ============================================================
  // GOING IN AND COMING BACK
  //
  // The reading fades and is taken off the page; the calculator fades
  // in over the same field. Nothing touches the canvas, which is the
  // whole point: the stars are where they were.
  // ============================================================
  let showing = false;

  function enterCalc() {
    if (showing) return;
    showing = true;
    page.classList.add("calc-going");
    const swap = () => {
      // `calc-on` is what takes the reading off the page — see the note
      // in style.css for why `hidden` on these could not do it.
      page.classList.remove("calc-going");
      page.classList.add("calc-on");
      calc.hidden = false;
      window.scrollTo(0, 0);
      // Told the page, so a reload or a shared link comes back here.
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", "#calculator");
      }
      calc.querySelector("h1").setAttribute("tabindex", "-1");
      calc.querySelector("h1").focus({ preventScroll: true });
    };
    if (REDUCE_MOTION) swap(); else window.setTimeout(swap, 420);
  }

  function leave() {
    if (!showing) return;
    showing = false;
    calc.classList.add("calc-going-out");
    const swap = () => {
      calc.hidden = false;
      calc.classList.remove("calc-going-out");
      calc.hidden = true;
      page.classList.remove("calc-on");
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      enter.focus();
      enter.scrollIntoView({ block: "center" });
    };
    if (REDUCE_MOTION) swap(); else window.setTimeout(swap, 320);
  }

  enter.addEventListener("click", enterCalc);
  calc.querySelector(".calc-back").addEventListener("click", leave);
  if (window.location.hash === "#calculator") enterCalc();

  // ============================================================
  // THE MODELS
  // ============================================================
  const models = [...calc.querySelectorAll(".calc-model")];
  let model = null;

  models.forEach((one) => {
    one.addEventListener("click", () => {
      const want = one.getAttribute("data-model");
      models.forEach((m) => m.classList.toggle("chosen", m === one));
      caveat.hidden = want !== "v2";
      model = want;
      build(want);
    });
  });

  /** A field, with its own label. */
  function field(id, label, suffix, value) {
    return '<label class="calc-field" for="' + id + '">' +
      '<span class="calc-field-name">' + label + "</span>" +
      '<input class="calc-input" id="' + id + '" type="number" step="any" value="' + value + '">' +
      (suffix ? '<span class="calc-field-unit">' + suffix + "</span>" : "") +
      "</label>";
  }

  function thresholds() {
    const A = abs(mv("IBR"));
    return '<div class="calc-part"><h2>The thresholds</h2>' +
      '<dl class="essay-key">' +
        "<div><dt>" + A + " &lt; 0.5</dt><dd>The blending character is dominant; and it is very difficult to make out the notes.</dd></div>" +
        "<div><dt>0.5 &#8804; " + A + " &#8804; 2</dt><dd>It is well blended but a person can still pick out SOME notes here and there.</dd></div>" +
        "<div><dt>" + A + " &gt; 2</dt><dd>You can make out almost all the notes.</dd></div>" +
      "</dl></div>";
  }

  function bigEquation(which) {
    const IBR = term("IBR", "IBR"), IC = term("IC", "IC"), BC = term("BC", "BC");
    if (which === "plain") {
      return IBR + '<span class="calc-eq-op">=</span>' + IC +
        '<span class="calc-eq-op">/</span>' + BC;
    }
    const sign = term("&#177;", "SIGN");
    const top = which === "v1" ? term("10", "TEN") : term("x", "X");
    const nn = term("n", which === "v1" ? "N1" : "N2");
    return sign + IBR + '<span class="calc-eq-op">=</span>' + IC +
      '<span class="calc-eq-op">/</span>' + BC +
      '<span class="calc-eq-op">&#215;</span>' + top +
      '<span class="calc-eq-op">/</span>' + nn;
  }

  function build(which) {
    const parts = [];

    parts.push('<div class="calc-part calc-equation-part">' +
      '<p class="calc-equation">' + bigEquation(which) + "</p>" +
      '<p class="calc-say" data-empty="Point at any part of the equation to see what it is.">' +
        "Point at any part of the equation to see what it is.</p>" +
      "</div>");

    if (which !== "plain") {
      parts.push('<p class="calc-note">Do note that there will be three equation given the third complication; one for the top, another for the mid and a third and final one for the dry down.</p>');
    }

    parts.push('<div class="calc-part"><h2>Input your values (estimations)</h2>' +
      '<div class="calc-inputs">' + inputsFor(which) + "</div></div>");

    if (which !== "plain") {
      parts.push(thresholds());
      parts.push('<div class="calc-part"><h2>Your readings</h2>' +
        '<div class="calc-table-wrap"><table class="calc-table"><thead><tr>' +
        "<th>Reading</th><th>Value</th><th>Against the thresholds</th><th>What that means</th>" +
        "</tr></thead><tbody></tbody></table></div></div>");
      parts.push('<div class="calc-part"><h2>Across the three stages</h2>' +
        '<div class="calc-graph"></div></div>');
    } else {
      parts.push(thresholds());
      parts.push('<div class="calc-part"><p class="calc-verdict"></p></div>');
    }

    shell.innerHTML = parts.join("");
    shell.hidden = false;
    wire(which);
    // The rest of it arrives from the top down, which is what the owner
    // asked for. A stagger written on the element rather than a
    // keyframe per part, so adding a part needs nothing here.
    [...shell.querySelectorAll(".calc-part, .calc-note")].forEach((one, i) => {
      one.style.setProperty("--n", String(i));
      one.classList.add("calc-arriving");
    });
    if (REDUCE_MOTION) {
      [...shell.querySelectorAll(".calc-arriving")].forEach((one) =>
        one.classList.remove("calc-arriving"));
    }
    recalc(which);
  }

  function stageInputs(which, stage, i) {
    const key = stage.replace(/\s+/g, "");
    return '<div class="calc-stage" data-stage="' + key + '">' +
      '<div class="calc-stage-fields">' +
        (which === "v2"
          ? field("n-" + key, mv("n") + sub(stage), "", "6") : "") +
        field("ic-" + key, mv("IC") + sub(stage), "%", "30") +
        field("bc-" + key, mv("BC") + sub(stage), "%", "70") +
      "</div>" +
      '<div class="calc-stage-zone"></div>' +
      '<div class="calc-stage-out">' +
        '<p class="calc-result"><span class="calc-result-name">' + mv("IBR") + sub(stage) +
          '</span><span class="calc-result-eq">=</span>' +
          '<span class="calc-result-value">&#8212;</span></p>' +
        '<div class="calc-steps"></div>' +
      "</div></div>";
  }

  function inputsFor(which) {
    if (which === "plain") {
      return '<div class="calc-stage" data-stage="One">' +
        '<div class="calc-stage-fields">' +
          field("ic-One", mv("IC"), "%", "30") +
          field("bc-One", mv("BC"), "%", "70") +
        "</div>" +
        '<div class="calc-stage-zone"></div>' +
        '<div class="calc-stage-out">' +
          '<p class="calc-result"><span class="calc-result-name">' + mv("IBR") +
            '</span><span class="calc-result-eq">=</span>' +
            '<span class="calc-result-value">&#8212;</span></p>' +
          '<div class="calc-steps"></div>' +
        "</div></div>";
    }
    const common = '<div class="calc-common">' +
      field(which === "v1" ? "n-all" : "x-all",
            which === "v1" ? mv("n") : mv("x"), "", which === "v1" ? "13" : "13") +
      '<div class="calc-sign"><span class="calc-field-name">&#177; (click one)</span>' +
        '<button class="calc-sign-pick chosen" type="button" data-sign="1">+</button>' +
        '<button class="calc-sign-pick" type="button" data-sign="-1">&#8722;</button>' +
      "</div></div>";
    return common + STAGES.map((s, i) => stageInputs(which, s, i)).join("");
  }

  // ============================================================
  // WIRING IT UP
  // ============================================================
  let sign = 1;

  function wire(which) {
    shell.querySelectorAll(".calc-input").forEach((one) => {
      one.addEventListener("input", () => recalc(which));
    });
    const picks = [...shell.querySelectorAll(".calc-sign-pick")];
    picks.forEach((one) => {
      one.addEventListener("click", () => {
        sign = Number(one.getAttribute("data-sign"));
        picks.forEach((p) => p.classList.toggle("chosen", p === one));
        recalc(which);
      });
    });
    sign = 1;

    const say = shell.querySelector(".calc-say");
    shell.querySelectorAll(".calc-term").forEach((one) => {
      const tell = () => {
        say.textContent = SAYS[one.getAttribute("data-say")] || "";
        say.classList.add("calc-say-on");
      };
      const hush = () => {
        say.textContent = say.getAttribute("data-empty");
        say.classList.remove("calc-say-on");
      };
      one.addEventListener("pointerenter", tell);
      one.addEventListener("focus", tell);
      one.addEventListener("pointerleave", hush);
      one.addEventListener("blur", hush);
      one.addEventListener("click", tell);
    });
  }

  const num = (id) => {
    const el = shell.querySelector("#" + id);
    if (!el) return NaN;
    const v = parseFloat(el.value);
    return isFinite(v) ? v : NaN;
  };

  function recalc(which) {
    if (!which) return;
    const stages = which === "plain" ? ["One"] : STAGES.map((s) => s.replace(/\s+/g, ""));
    const nAll = which === "v1" ? num("n-all") : NaN;
    const xAll = which === "v2" ? num("x-all") : NaN;
    const got = [];

    stages.forEach((key, i) => {
      const box = shell.querySelector('.calc-stage[data-stage="' + key + '"]');
      if (!box) return;
      const ic = num("ic-" + key);
      const bc = num("bc-" + key);
      const label = which === "plain" ? "" : STAGES[i];
      const heads = which === "plain" ? "none" : (sign > 0 ? "out" : "in");
      const howMany = which === "plain" ? 10
        : (which === "v1" ? nAll : num("n-" + key));

      box.querySelector(".calc-stage-zone").innerHTML =
        zone(isFinite(howMany) ? howMany : 10, isFinite(ic) ? ic : 0, heads, label);

      // The working, said the way the piece says it.
      const ratio = (ic / 100) / (bc / 100);
      let value = ratio;
      const steps = [];
      const NAME = mv("IBR") + (label ? sub(label) : "");
      if (which === "plain") {
        steps.push([NAME, mv("IC") + " / " + mv("BC")]);
        steps.push(["", show(ic / 100) + "/" + show(bc / 100)]);
        steps.push(["", show(value)]);
      } else {
        const top = which === "v1" ? nAll : xAll;
        const bot = which === "v1" ? nAll : howMany;
        const scale = which === "v1" ? 10 / nAll : xAll / howMany;
        value = ratio * scale;
        steps.push([NAME, "(" + mv("IC") + (label ? sub(label) : "") + " / " +
                    mv("BC") + (label ? sub(label) : "") + ") &#215; " +
                    (which === "v1" ? "10" : mv("x")) + "/" + mv("n") +
                    (which === "v2" && label ? sub(label) : "")]);
        steps.push(["", "(" + show(ic / 100) + "/" + show(bc / 100) + ") &#215; " +
                    (which === "v1" ? "10" : show(xAll)) + "/" + show(bot)]);
        steps.push(["", show(ratio) + " &#215; " + show(scale)]);
        steps.push(["", show(value)]);
        steps.push(["", (sign > 0 ? "+" : "−") + show(Math.abs(value)) +
                    ' <span class="math-aside">(accounting for the direction of the arrows)</span>']);
      }

      box.querySelector(".calc-steps").innerHTML =
        '<div class="math-block">' + steps.map(([lhs, rhs]) =>
          '<p class="math-line"><span class="mlhs">' + lhs + '</span>' +
          '<span class="meq">=</span><span class="mrhs">' + rhs + "</span></p>").join("") +
        "</div>";

      const shownValue = which === "plain"
        ? show(value)
        : (isFinite(value) ? (sign > 0 ? "+" : "−") + show(Math.abs(value)) : "—");
      box.querySelector(".calc-result-value").innerHTML = shownValue;
      got.push({ label: label || "IBR", value: which === "plain" ? value : sign * Math.abs(value) });
    });

    if (which === "plain") {
      const one = got[0];
      const b = band(one.value);
      const out = shell.querySelector(".calc-verdict");
      if (out) {
        out.innerHTML = b
          ? "Your calculated " + mv("IBR") + " is <strong>" + show(one.value) +
            "</strong>, which means that it is " + b.say
          : "Fill in both values above and this will say where your reading falls.";
      }
      return;
    }

    const rows = got.map((one) => {
      const b = band(one.value);
      const NAME = mv("IBR") + sub(one.label);
      return "<tr><td>" + NAME + "</td><td>" +
        (isFinite(one.value) ? (one.value > 0 ? "+" : "−") + show(Math.abs(one.value)) : "—") +
        "</td><td>" + (b ? abs(NAME) + " " + b.where : "—") +
        "</td><td>" + (b ? b.table : "—") + "</td></tr>";
    }).join("");
    const tbody = shell.querySelector(".calc-table tbody");
    if (tbody) tbody.innerHTML = rows;

    const holder = shell.querySelector(".calc-graph");
    if (holder) holder.innerHTML = graph(got, which);
  }

  // ============================================================
  // THE GRAPH — the same one the piece draws, on your own numbers
  // ============================================================
  function graph(got, which) {
    const W = 720, H = 470;
    const ml = 104, mr = 44, mt = 34, mb = 76;
    const x0 = ml, x1 = W - mr, y0 = H - mb, y1 = mt;
    const vals = got.map((o) => Math.abs(o.value)).filter(isFinite);
    const most = Math.max(5, Math.ceil(Math.max.apply(null, vals.concat([2.5])) + 0.5));
    const X = (i) => x0 + ((x1 - x0) * i) / 2;
    const Y = (v) => y0 + ((y1 - y0) * v) / most;
    const b = [];
    for (let k = 0; k <= most; k++) {
      b.push('<line class="graph-grid" x1="' + x0 + '" y1="' + Y(k).toFixed(1) +
             '" x2="' + x1 + '" y2="' + Y(k).toFixed(1) + '"/>');
      b.push('<text class="graph-tick" x="' + (x0 - 14) + '" y="' + (Y(k) + 5).toFixed(1) +
             '">' + k + "</text>");
    }
    [[0.5, "0.5"], [2, "2"]].forEach(([v, lab]) => {
      b.push('<line class="graph-hold" x1="' + x0 + '" y1="' + Y(v).toFixed(1) +
             '" x2="' + x1 + '" y2="' + Y(v).toFixed(1) + '"/>');
      b.push('<text class="graph-hold-name" x="' + (x1 - 8) + '" y="' + (Y(v) - 9).toFixed(1) +
             '">' + lab + "</text>");
    });
    b.push('<line class="graph-axis" x1="' + x0 + '" y1="' + y0 + '" x2="' + x1 + '" y2="' + y0 + '"/>');
    b.push('<line class="graph-axis" x1="' + x0 + '" y1="' + y0 + '" x2="' + x0 + '" y2="' + y1 + '"/>');
    ["Top", "Mid", "Base"].forEach((lab, i) => {
      b.push('<line class="graph-grid" x1="' + X(i).toFixed(1) + '" y1="' + y0 +
             '" x2="' + X(i).toFixed(1) + '" y2="' + y1 + '"/>');
      b.push('<text class="graph-tick graph-mid" x="' + X(i).toFixed(1) + '" y="' + (y0 + 26) +
             '">' + lab + "</text>");
    });
    // PLOTTED ON THE ABSOLUTE VALUE, because the scale has no negative
    // half: the sign is the direction and the table already carries it.
    const pts = got.map((o, i) => [X(i), Y(Math.abs(o.value))])
      .filter((p) => isFinite(p[1]));
    if (pts.length > 1) {
      b.push('<polyline class="graph-run" points="' +
        pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ") + '"/>');
    }
    got.forEach((o, i) => {
      if (!isFinite(o.value)) return;
      const y = Y(Math.abs(o.value));
      const last = i === got.length - 1;
      b.push('<circle class="graph-dot" cx="' + X(i).toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5"/>');
      b.push('<text class="graph-read' + (last ? " graph-read-end" : "") + '" x="' +
             (X(i) + (last ? -12 : 12)).toFixed(1) + '" y="' + (y - 12).toFixed(1) + '">' +
             show(Math.abs(o.value)) + "</text>");
    });
    b.push('<text class="graph-axis-name graph-mid" x="' + ((x0 + x1) / 2) + '" y="' + (H - 22) + '">Time</text>');
    b.push('<text class="graph-axis-name" x="28" y="' + ((y0 + y1) / 2) +
           '" transform="rotate(-90 28 ' + ((y0 + y1) / 2) + ')">Modified IBR (var. ' +
           (which === "v1" ? "1" : "2") + ")</text>");
    return '<svg class="zone graph" viewBox="0 0 ' + W + " " + H +
      '" role="img" aria-label="Your readings across the three stages">' + b.join("") + "</svg>";
  }
})();
