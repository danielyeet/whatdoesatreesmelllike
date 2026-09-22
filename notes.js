// ============================================================
// VIEW NOTES — the pyramid, in a window over the page
//
// The owner asked for it on every fragrance: "at the end of the text,
// in a different font and emphasized, there would be a button that you
// could click". So: a boxed VIEW NOTES at the foot of a fragrance's
// writing, set in the site's mono rather than its reading face, and a
// window carrying the Top, the Mid and the Base — and, as they asked,
// the SOURCE underneath.
//
// IT IS A POPUP WINDOW, EVERYWHERE, and that is the owner's second
// word on it: it opened BESIDE the writing at first, as a column in
// the part's own row, and they asked for a window instead — "I WANT
// YOU to make it a popup window actually".
//
// That turned out to be the simpler thing as well as the asked-for
// one. Standing in the row, the panel had to be paid for out of
// somebody's width: a part is a picture and a column of writing inside
// 940px, and a 252px panel in there left the writing about 110px
// across until the plate was told to give way. A window over the page
// costs the layout nothing at all, so none of that is here any more —
// no `notes-on`, no narrowed plate, no second arrangement for a phone.
// One window, sized to whatever it is opened on.
//
// A PYRAMID IS NOT ALWAYS A PYRAMID. Plenty of houses publish one
// undivided list and no top/mid/base; Pineward is one of them. The
// owner allowed for that in as many words — "unless the source states
// that there is no division between top mid and base" — so an entry is
// a pyramid OR a flat list, and the window says which rather than
// inventing a division.
//
// AND A FRAGRANCE WITH NO ENTRY STILL GETS THE BUTTON. It opens a
// window saying the notes have not been found yet. That is on purpose:
// the alternative is no button, and then a house with half its notes
// missing looks finished. What is missing should be visible.
//
// WHERE THE DATA IS: `notes-data.js`, one entry per fragrance, keyed
// by the page's own `window.HOUSE_NOTES` and the part's number. It is
// never written in the markup, because there are ninety-odd of them
// and the markup is the owner's to edit.
//
// WITHOUT THIS SCRIPT there is no button and no window, and the page
// is all of its writing exactly as before.
// ============================================================
(function () {
  const KEY = window.HOUSE_NOTES;
  const ALL = window.FRAGRANCE_NOTES || {};

  const KINDS = [
    { part: "pine-part", text: "pine-text", title: "pine-title" },
    { part: "adar-part", text: "adar-text", title: "adar-title" },
    { part: "human-part", text: "human-text", title: "human-title" },
  ];

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const OPEN_MS = REDUCE_MOTION ? 0 : 300;
  /** HOW LONG TO WAIT FOR THE WINDOW TO GO, AND IT IS ONLY THE BACKSTOP.
      The fade itself is what `close` waits for now; this number is
      there for the case where the transition never runs at all — a
      background tab, a browser that has been told not to animate.

      IT USED TO BE THE WHOLE OF IT, AND IT WAS THE OWNER'S "it glitches
      slightly when you click away". Two things were wrong with a timer
      and both had to be, because either alone would have been enough:
      it was set to 220ms against a fade the stylesheet runs for 300,
      and the fade does not START when the timer does — a click has to
      be handled and the styles recalculated first, which on this page
      is about another 80. So `settle` hid the window 180ms into a
      300ms fade. Measured: the panel and THE SCRIM WITH IT went from
      0.606 opacity to nothing in a single frame, and the scrim is a
      grey wash over the whole page, so what you saw was the entire
      window flash.

      Waiting for `transitionend` cannot drift out of step with the
      stylesheet, which a number always can. */
  const SHUT_MS = REDUCE_MOTION ? 0 : 900;

  /** The window that is up, if one is: its own `close`. */
  let showing = null;
  /** Every window's `close`, for the things that shut all of them. */
  const shutters = [];

  /** The one scrim the page has, made the first time a window needs it. */
  let scrim = null;
  function theScrim() {
    if (scrim) return scrim;
    scrim = document.createElement("div");
    scrim.className = "note-scrim";
    scrim.hidden = true;
    // PRESSING THE PAGE BEHIND CLOSES IT, which anything standing over
    // the page owes the reader.
    scrim.addEventListener("click", () => { if (showing) showing(false); });
    document.body.appendChild(scrim);
    return scrim;
  }

  // A WORD OF WARNING ON A SOURCE, shown when its name is hovered.
  // Keyed by the source's own name, so the data file never repeats it:
  // there are seventy-odd entries and the caution belongs to the
  // source, not to any one of them.
  //
  // WHY THIS ONE. The house's own page is the first source for every
  // fragrance here and Fragrantica is only the fallback — the owner
  // asked for that hierarchy in as many words — so where Fragrantica
  // is named, it is named because the house publishes nothing, and the
  // reader should know it is a crowd-edited list rather than the
  // house's own.
  const CAUTION = {
    Fragrantica: "Fragrantica\u2019s notes are not to be trusted as 100% fact.",
  };

  /** A list of notes as one line, in the order the source gives them. */
  function say(list) {
    return Array.isArray(list) ? list.join(", ") : String(list || "");
  }

  function row(label, list) {
    return '<div class="note-row"><dt>' + label + "</dt><dd>" + say(list) + "</dd></div>";
  }

  /** WHERE IT CAME FROM, with the caution on it if it is the fallback.
      `mark` keeps the tooltip's id unique, because one window can carry
      two of these — Haxan names the perfumer above and Fragrantica
      below. */
  function cite(source, id, mark) {
    if (!source) return "";
    const warn = CAUTION[source.name];
    const at = id + mark + "-warn";
    // `aria-describedby` rather than a `title`: a screen reader is told
    // the caution whether or not anything is hovered, and a title
    // attribute would sit there as a second, uglier tooltip.
    const tip = warn ? ' aria-describedby="' + at + '"' : "";
    const from = source.url
      ? '<a class="note-cite" href="' + source.url +
          '" rel="noopener noreferrer" target="_blank"' + tip + ">" + source.name + "</a>"
      : '<span class="note-cite"' + tip + ">" + source.name + "</span>";
    return '<p class="note-source"><span>Source</span> ' + from +
      (warn ? '<span class="note-warn" role="tooltip" id="' + at + '">' +
        warn + "</span>" : "") + "</p>";
  }

  /** The notes themselves, either shape. `quiet` leaves off the line
      about there being no division, which is worth saying once per
      window and not once per list — Haxan carries two lists and had it
      twice. */
  function lists(entry, quiet) {
    if (entry.flat) {
      // THE SOURCE GIVES ONE LIST AND NO DIVISION, and saying so is the
      // point: an undivided list set out as Top / Mid / Base would be
      // three claims the source never made.
      return (quiet ? "" :
        '<p class="note-undivided">The source gives one list, undivided.</p>') +
        '<dl class="note-pyramid">' + row("Notes", entry.flat) + "</dl>";
    }
    let out = '<dl class="note-pyramid">';
    if (entry.top) out += row("Top", entry.top);
    if (entry.mid) out += row("Mid", entry.mid);
    if (entry.base) out += row("Base", entry.base);
    return out + "</dl>";
  }

  /** WHAT THE NOTES WINDOW SAYS. */
  function fill(entry, id) {
    if (!entry) {
      return '<p class="note-waiting">The notes for this one have not been found yet.</p>';
    }
    let out = "";
    // WHICH VERSION THESE NOTES BELONG TO, and the owner asked for it
    // to be said on the page rather than only in the aside: several
    // Pineward fragrances have been reformulated and the note list
    // changes underneath the name, so a list with no year on it is a
    // list you cannot check.
    if (entry.version) {
      out += '<p class="note-version"><span>Version</span> <strong>' +
        entry.version + "</strong></p>";
    }
    if (entry.say) out += '<p class="note-half">' + entry.say + "</p>";
    // A SOURCE THAT WAS LOOKED AT AND SAID NOTHING is not the same as a
    // fragrance nobody has looked up yet, and the window says which.
    // ADAR prints prose for two of its fragrances and never names a
    // material; one Grande Parfums title could not be found online at
    // all; Ataraxia has not disclosed one fragrance's notes. All three
    // are answers, and the last of them still has a SECOND list under
    // it — which is why this stands in for the lists rather than
    // returning early, as it did when nothing could follow it.
    out += entry.missing
      ? '<p class="note-waiting">' + entry.missing + "</p>"
      : lists(entry);
    if (entry.note) out += '<p class="note-aside">' + entry.note + "</p>";
    out += cite(entry.source, id, "");
    // A SECOND LIST, UNDER THE FIRST. Only Haxan has one: the perfumer
    // names what is in it and Fragrantica reads the same fragrance its
    // own way, and the owner asked for both, one above the other.
    if (entry.also) {
      out += '<div class="note-also">';
      out += '<p class="note-half">' + entry.also.say + "</p>";
      out += entry.also.missing
        ? '<p class="note-waiting">' + entry.also.missing + "</p>"
        : lists(entry.also, true);
      if (entry.also.note) out += '<p class="note-aside">' + entry.also.note + "</p>";
      out += cite(entry.also.source, id, "-also");
      out += "</div>";
    }
    return out;
  }

  /** WHAT THE OLFACTORY LANDSCAPE WINDOW SAYS. The same window by a
      different name: Almost Human publishes no notes at all, and what
      it publishes instead is five impressions. It is NOT called a list
      of notes here, because it is not one. */
  function fillLandscape(land, id) {
    return '<p class="note-undivided">The house sets its fragrances out as an ' +
      "olfactory landscape rather than as notes.</p>" +
      '<dl class="note-pyramid note-pyramid-wide">' + row("Landscape", land.flat) + "</dl>" +
      cite(land.source, id, "");
  }

  const safe = (text) => String(text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // THE RENDERER, HANDED OUT. The Fragrances view of the contact sheet
  // opens a fragrance IN PLACE now and shows its notes there, and it
  // must show them the same way a house page does — one renderer, or
  // the two drift apart and a reader is told different things about
  // the same fragrance depending on which door they came in by.
  window.NOTE_PANEL = { html: fill, landscape: fillLandscape };

  // AND EVERYTHING BELOW HERE NEEDS A HOUSE. A page with no
  // `window.HOUSE_NOTES` has no parts to put buttons on; it has taken
  // what it came for above.
  if (!KEY) return;

  let made = 0;
  const wanted = [];

  /** ONE BUTTON AND THE WINDOW IT OPENS.
      A fragrance can have two of these — Almost Human's five carry an
      OLFACTORY LANDSCAPE beside their notes — so everything that used
      to be written once per fragrance is written once per WINDOW, and
      the two share nothing but the page they stand over. */
  function makeWindow(o) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "note-open" + (o.extra ? " " + o.extra : "");
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", o.id);
    button.innerHTML = '<span class="note-open-mark" aria-hidden="true"></span>' +
      '<span class="note-open-say">' + o.calls + "</span>";
    o.text.appendChild(button);

    // THE WINDOW LIVES ON THE BODY, not inside the fragrance, and it
    // has to: a fixed thing inside an ancestor carrying a `transform`
    // is positioned against that ancestor rather than against the
    // window, and a part's own box is given one while it opens. Put it
    // in the part and it would be fixed to the inside of a <details>.
    const heading = o.id + "-head";
    const panel = document.createElement("div");
    panel.className = "note-panel";
    panel.id = o.id;
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", heading);
    panel.innerHTML =
      '<div class="note-bar">' +
        '<p class="note-head" id="' + heading + '">' +
          '<span class="note-head-say">' + o.titled + "</span>" +
          (o.name ? '<span class="note-head-of">' + safe(o.name) + "</span>" : "") +
        "</p>" +
        '<button class="note-shut" type="button" aria-label="Close this">' +
          '<span aria-hidden="true">×</span></button>' +
      "</div>" +
      '<div class="note-in">' + o.body + "</div>";
    document.body.appendChild(panel);

    let up = false;
    let moving = false;
    let timer = 0;
    /** The listener waiting for the window's fade to finish, if one is.
        Held so it can be taken off again — a window reopened before it
        had finished going would otherwise be settled shut by the fade
        it was already half way through. */
    let ending = null;

    /** Stop listening for the fade to finish. Called both when it has
        and when the window is opened again before it ever did. */
    function stopWaiting() {
      if (!ending) return;
      panel.removeEventListener("transitionend", ending);
      ending = null;
    }

    function settle() {
      window.clearTimeout(timer);
      stopWaiting();
      panel.hidden = true;
      panel.classList.remove("is-up");
      if (showing === close) showing = null;
      if (!document.querySelector(".note-panel:not([hidden])")) {
        const sc = theScrim();
        sc.classList.remove("is-on");
        sc.hidden = true;
        document.body.classList.remove("note-holding");
      }
      up = false;
      moving = false;
    }

    /** CLOSING. `atOnce` skips the animation, which is what happens
        when the fragrance itself is being collapsed — there is no sense
        easing a window shut because the box it was opened from is
        closing. */
    function close(atOnce) {
      if (!up) return;
      window.clearTimeout(timer);
      stopWaiting();
      up = false;
      button.setAttribute("aria-expanded", "false");
      button.classList.remove("is-on");
      const sc = theScrim();
      sc.classList.remove("is-on");
      panel.classList.remove("is-up");
      if (atOnce || REDUCE_MOTION) { settle(); return; }
      moving = true;
      // THE FADE ITSELF SAYS WHEN IT IS DONE. Only the panel's own
      // opacity counts: a transition on anything inside it bubbles up
      // here too, and the close button alone has one.
      ending = (event) => {
        if (event.target !== panel || event.propertyName !== "opacity") return;
        settle();
      };
      panel.addEventListener("transitionend", ending);
      timer = window.setTimeout(settle, SHUT_MS);
    }

    function open() {
      window.clearTimeout(timer);
      stopWaiting();
      // ONE AT A TIME: a second window over the first would have
      // nothing to go back to. This is what keeps a fragrance's two
      // buttons from ever both being up at once.
      if (showing && showing !== close) showing(true);
      showing = close;
      up = true;
      button.setAttribute("aria-expanded", "true");
      button.classList.add("is-on");

      const sc = theScrim();
      sc.hidden = false;
      panel.hidden = false;
      document.body.classList.add("note-holding");

      if (REDUCE_MOTION) {
        sc.classList.add("is-on");
        panel.classList.add("is-up");
        moving = false;
      } else {
        moving = true;
        // Two frames: one for the browser to take the window as being
        // where it starts from, one to move it.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            sc.classList.add("is-on");
            panel.classList.add("is-up");
          });
        });
        timer = window.setTimeout(() => { moving = false; }, OPEN_MS + 40);
      }

      // The close takes the keyboard, so escape and tab both have
      // somewhere sensible to start from.
      const shut = panel.querySelector(".note-shut");
      if (shut) shut.focus({ preventScroll: true });
    }

    button.addEventListener("click", () => {
      if (moving) return;
      if (up) close(false); else open();
    });

    const shut = panel.querySelector(".note-shut");
    if (shut) {
      shut.addEventListener("click", () => {
        close(false);
        button.focus({ preventScroll: true });
      });
    }

    shutters.push(close);

    // THE WINDOW GOES WITH THE FRAGRANCE. Collapse a part and its
    // windows go with it, and opening the part again leaves them shut —
    // they have to be asked for again. Two listeners, because the two
    // things happen at different moments: the CLICK is when the reader
    // asked for it, and the part's own script then takes most of a
    // second to close the box, so the window goes at once rather than
    // standing over a page that is rearranging itself behind it. The
    // TOGGLE is the safety net, for a part closed any other way.
    o.summary.addEventListener("click", () => {
      if (o.part.open && up) close(true);
    });
    o.part.addEventListener("toggle", () => {
      if (!o.part.open && up) close(true);
    });
  }

  KINDS.forEach((kind) => {
    document.querySelectorAll("details." + kind.part).forEach((part) => {
      const text = part.querySelector("." + kind.text);
      const summary = part.querySelector("summary");
      if (!text || !summary) return;
      // A fragrance with nothing written in it yet has nothing to put a
      // button at the end of.
      if (!text.querySelector("p, ul")) return;

      const no = (part.id.match(/(\d+)$/) || [])[1];
      if (!no) return;
      const entry = ALL[KEY + ":" + no];
      if (!entry || entry.missing) wanted.push(no);
      const id = "notes-" + KEY + "-" + no;
      const named = part.querySelector("." + kind.title);
      const name = named ? named.textContent.trim() : "";

      // THE LANDSCAPE COMES FIRST, which is where the owner asked for
      // it: "add an olfactory landscape button before the notes". Both
      // buttons are appended to the same writing, so building this one
      // first is what puts it first.
      if (entry && entry.landscape) {
        makeWindow({
          part: part, summary: summary, text: text,
          id: id + "-landscape",
          extra: "note-open-landscape",
          calls: "Olfactory landscape",
          titled: "Landscape",
          name: name,
          body: fillLandscape(entry.landscape, id + "-landscape"),
        });
      }

      makeWindow({
        part: part, summary: summary, text: text,
        id: id,
        calls: "View notes",
        titled: "Notes",
        name: name,
        body: fill(entry, id),
      });
      made += 1;
    });
  });

  // ESCAPE CLOSES IT, and so does the page changing shape underneath
  // it: the window is sized against the viewport, and a phone turned on
  // its side can leave it taller than the screen it is centred in.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" && event.key !== "Esc") return;
    if (showing) showing(false);
  });
  window.addEventListener("orientationchange", () => {
    shutters.forEach((close) => close(true));
  });

  // WHAT IS MISSING, WHERE THE OWNER WILL SEE IT. Not on the page — in
  // the console, once, when there is something to say. Filling ninety
  // of these in is a job that will take several rounds, and knowing how
  // far it has got should not mean counting by hand.
  if (made && wanted.length) {
    // eslint-disable-next-line no-console
    console.info("[notes] " + KEY + ": " + (made - wanted.length) + " of " + made +
      " filled in. Still wanted: " + wanted.join(", "));
  }
})();
