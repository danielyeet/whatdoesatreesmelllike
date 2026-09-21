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
  if (!KEY) return;
  const ALL = window.FRAGRANCE_NOTES || {};

  const KINDS = [
    { part: "pine-part", text: "pine-text", title: "pine-title" },
    { part: "adar-part", text: "adar-text", title: "adar-title" },
    { part: "human-part", text: "human-text", title: "human-title" },
  ];

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const OPEN_MS = REDUCE_MOTION ? 0 : 300;
  const SHUT_MS = REDUCE_MOTION ? 0 : 220;

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

  /** A list of notes as one line, in the order the source gives them. */
  function say(list) {
    return Array.isArray(list) ? list.join(", ") : String(list || "");
  }

  function row(label, list) {
    return '<div class="note-row"><dt>' + label + "</dt><dd>" + say(list) + "</dd></div>";
  }

  /** WHAT THE WINDOW SAYS, and there are four things it can be. */
  function fill(entry) {
    if (!entry) {
      return '<p class="note-waiting">The notes for this one have not been found yet.</p>';
    }
    let out = "";
    if (entry.flat) {
      // THE SOURCE GIVES ONE LIST AND NO DIVISION, and saying so is the
      // point: an undivided list set out as Top / Mid / Base would be
      // three claims the source never made.
      out += '<p class="note-undivided">The source gives one list, undivided.</p>';
      out += '<dl class="note-pyramid">' + row("Notes", entry.flat) + "</dl>";
    } else {
      out += '<dl class="note-pyramid">';
      if (entry.top) out += row("Top", entry.top);
      if (entry.mid) out += row("Mid", entry.mid);
      if (entry.base) out += row("Base", entry.base);
      out += "</dl>";
    }
    if (entry.note) out += '<p class="note-aside">' + entry.note + "</p>";
    if (entry.source) {
      const from = entry.source.url
        ? '<a href="' + entry.source.url + '" rel="noopener noreferrer" target="_blank">' +
            entry.source.name + "</a>"
        : entry.source.name;
      out += '<p class="note-source"><span>Source</span> ' + from + "</p>";
    }
    return out;
  }

  const safe = (text) => String(text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let made = 0;
  const wanted = [];

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
      if (!entry) wanted.push(no);
      const id = "notes-" + KEY + "-" + no;
      const heading = id + "-head";
      const named = part.querySelector("." + kind.title);
      const name = named ? named.textContent.trim() : "";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "note-open";
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", id);
      button.innerHTML = '<span class="note-open-mark" aria-hidden="true"></span>' +
        '<span class="note-open-say">View notes</span>';
      text.appendChild(button);

      // THE WINDOW LIVES ON THE BODY, not inside the fragrance, and it
      // has to: a fixed thing inside an ancestor carrying a `transform`
      // is positioned against that ancestor rather than against the
      // window, and a part's own box is given one while it opens. Put
      // it in the part and it would be fixed to the inside of a
      // <details>.
      const panel = document.createElement("div");
      panel.className = "note-panel";
      panel.id = id;
      panel.hidden = true;
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-labelledby", heading);
      panel.innerHTML =
        '<div class="note-bar">' +
          '<p class="note-head" id="' + heading + '">' +
            '<span class="note-head-say">Notes</span>' +
            (name ? '<span class="note-head-of">' + safe(name) + "</span>" : "") +
          "</p>" +
          '<button class="note-shut" type="button" aria-label="Close the notes">' +
            '<span aria-hidden="true">\u00d7</span></button>' +
        "</div>" +
        '<div class="note-in">' + fill(entry) + "</div>";
      document.body.appendChild(panel);
      made += 1;

      let up = false;
      let moving = false;
      let timer = 0;

      function settle() {
        window.clearTimeout(timer);
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
          when the fragrance itself is being collapsed — there is no
          sense easing a window shut because the box it was opened from
          is closing. */
      function close(atOnce) {
        if (!up) return;
        window.clearTimeout(timer);
        up = false;
        button.setAttribute("aria-expanded", "false");
        button.classList.remove("is-on");
        const sc = theScrim();
        sc.classList.remove("is-on");
        panel.classList.remove("is-up");
        if (atOnce || REDUCE_MOTION) { settle(); return; }
        moving = true;
        timer = window.setTimeout(settle, SHUT_MS + 40);
      }

      function open() {
        window.clearTimeout(timer);
        // ONE AT A TIME: a second window over the first would have
        // nothing to go back to.
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

      // THE NOTES GO WITH THE FRAGRANCE. Collapse a part and its window
      // goes with it, and opening the part again leaves it shut — it
      // has to be asked for again. Two listeners, because the two
      // things happen at different moments: the CLICK is when the
      // reader asked for it, and the part's own script then takes most
      // of a second to close the box, so the window goes at once rather
      // than standing over a page that is rearranging itself behind it.
      // The TOGGLE is the safety net, for a part closed any other way.
      summary.addEventListener("click", () => {
        if (part.open && up) close(true);
      });
      part.addEventListener("toggle", () => {
        if (!part.open && up) close(true);
      });
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
