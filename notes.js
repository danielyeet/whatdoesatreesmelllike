// ============================================================
// VIEW NOTES — the pyramid beside a fragrance
//
// The owner asked for it on every fragrance: "at the end of the text,
// in a different font and emphasized, there would be a button that you
// could click, it would open a tab that works like a toggle on the
// RIGHT side of the screen (next to the paragraphs of text)".
//
// So: a boxed VIEW NOTES at the foot of a fragrance's writing, set in
// the site's mono rather than its reading face, and a panel that opens
// beside the writing carrying the Top, the Mid and the Base — and, as
// they asked, the SOURCE underneath.
//
// A PYRAMID IS NOT ALWAYS A PYRAMID. Plenty of houses publish one
// undivided list of notes and no top/mid/base at all; Pineward is one
// of them. The owner allowed for that in as many words — "unless the
// source states that there is no division between top mid and base" —
// so a fragrance's entry may be a pyramid OR a flat list, and the
// panel says which it is rather than inventing a division.
//
// AND A FRAGRANCE WITH NO ENTRY STILL GETS THE BUTTON. It opens a
// panel saying the notes have not been found yet. That is on purpose:
// the alternative is no button, and then a house with half its notes
// missing looks finished. What is missing should be visible.
//
// WHERE THE DATA IS: `notes-data.js`, one entry per fragrance, keyed
// by the page's own `window.HOUSE_NOTES` and the part's number. It is
// never written in the markup, because there are ninety-odd of them
// and the markup is the owner's to edit.
//
// WHAT IT ATTACHES TO: every `<details>` that is a fragrance, under
// whichever of the three names its page uses — `pine-part`,
// `adar-part`, `human-part`. The button goes at the end of that part's
// writing and the panel beside it, as a third thing in the row that
// already holds the picture and the writing.
//
// WITHOUT THIS SCRIPT there is no button and no panel, and the page is
// all of its writing exactly as before.
// ============================================================
(function () {
  const KEY = window.HOUSE_NOTES;
  if (!KEY) return;
  const ALL = window.FRAGRANCE_NOTES || {};

  const KINDS = [
    { part: "pine-part", body: "pine-body", text: "pine-text" },
    { part: "adar-part", body: "adar-body", text: "adar-text" },
    { part: "human-part", body: "human-body", text: "human-text" },
  ];

  const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const OPEN_MS = REDUCE_MOTION ? 0 : 420;   // beside the writing
  const POP_MS = REDUCE_MOTION ? 0 : 340;    // and up from the foot of a phone
  const EASE = "cubic-bezier(0.42, 0.02, 0.24, 1)";

  // WHERE THERE IS NO ROOM BESIDE THE WRITING. The same width the
  // stylesheet turns the part's row into a column at — below it the
  // panel is a sheet over the page instead of a column beside it, and
  // the two numbers have to agree or the panel is laid out one way and
  // animated the other.
  const POPUP = window.matchMedia("(max-width: 860px)");

  /** The one scrim the page has, made the first time a sheet needs it.*/
  let scrim = null;
  function theScrim() {
    if (scrim) return scrim;
    scrim = document.createElement("div");
    scrim.className = "note-scrim";
    scrim.hidden = true;
    scrim.addEventListener("click", () => { if (openPopup) openPopup(false); });
    document.body.appendChild(scrim);
    return scrim;
  }

  /** The sheet that is up, if one is: its own `close`. */
  let openPopup = null;
  /** Every panel's `close`, for the things that shut all of them. */
  const shutters = [];

  /** A list of notes as one line, in the order the source gives them. */
  function say(list) {
    return Array.isArray(list) ? list.join(", ") : String(list || "");
  }

  function row(label, list) {
    return '<div class="note-row"><dt>' + label + "</dt><dd>" + say(list) + "</dd></div>";
  }

  /** WHAT THE PANEL SAYS, and there are four things it can be. */
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

  let made = 0;

  KINDS.forEach((kind) => {
    document.querySelectorAll("details." + kind.part).forEach((part) => {
      const body = part.querySelector("." + kind.body);
      const text = part.querySelector("." + kind.text);
      if (!body || !text) return;
      // A fragrance with nothing written in it yet has nothing to put a
      // button at the end of.
      if (!text.querySelector("p, ul")) return;

      const summary = part.querySelector("summary");
      if (!summary) return;
      const no = (part.id.match(/(\d+)$/) || [])[1];
      if (!no) return;
      const entry = ALL[KEY + ":" + no];
      const id = "notes-" + KEY + "-" + no;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "note-open";
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", id);
      button.innerHTML = '<span class="note-open-mark" aria-hidden="true"></span>' +
        '<span class="note-open-say">View notes</span>';
      text.appendChild(button);

      const panel = document.createElement("aside");
      panel.className = "note-panel";
      panel.id = id;
      panel.hidden = true;
      panel.innerHTML =
        '<p class="note-head">Notes</p>' +
        '<button class="note-shut" type="button" aria-label="Close the notes">' +
          '<span aria-hidden="true">\u00d7</span></button>' +
        '<div class="note-in">' + fill(entry) + "</div>";
      body.appendChild(panel);
      made += 1;

      // WHERE THE PANEL LIVES ON A WIDE WINDOW. On a phone it is moved
      // out to the body and back again — see `openUp`.
      const home = body;
      let shown = false;
      let moving = false;
      let asPopup = false;
      let timer = 0;

      function say(open) {
        button.setAttribute("aria-expanded", open ? "true" : "false");
        button.classList.toggle("is-on", open);
        // THE PICTURE GIVES WAY, NOT THE WRITING — but only when the
        // panel is actually standing in the row. As a popup it is not,
        // so the part is left exactly as it was.
        part.classList.toggle("notes-on", open && !asPopup);
      }

      /** Put everything back to how it is when the panel is shut, with
          no animation left running on it. */
      function settle() {
        window.clearTimeout(timer);
        panel.hidden = true;
        panel.style.transition = "";
        panel.style.width = "";
        panel.style.opacity = "";
        panel.classList.remove("note-pop", "is-up");
        panel.removeAttribute("role");
        panel.removeAttribute("aria-modal");
        if (panel.parentNode !== home) home.appendChild(panel);
        if (openPopup === close) openPopup = null;
        if (!document.querySelector(".note-panel.note-pop")) {
          const sc = theScrim();
          sc.classList.remove("is-on");
          sc.hidden = true;
          document.body.classList.remove("note-holding");
        }
        asPopup = false;
        shown = false;
        moving = false;
      }

      /** CLOSING. `atOnce` skips the animation, which is what happens
          when the fragrance itself is being collapsed — there is no
          sense easing a panel shut inside a box that is also closing. */
      function close(atOnce) {
        if (!shown) return;
        window.clearTimeout(timer);
        shown = false;
        say(false);

        if (atOnce || REDUCE_MOTION) {
          settle();
          return;
        }

        moving = true;
        if (asPopup) {
          const sc = theScrim();
          sc.classList.remove("is-on");
          panel.classList.remove("is-up");
          timer = window.setTimeout(settle, POP_MS + 40);
          return;
        }

        const from = panel.getBoundingClientRect().width;
        panel.style.width = from + "px";
        panel.style.opacity = "1";
        requestAnimationFrame(() => {
          panel.style.transition =
            "width " + OPEN_MS + "ms " + EASE + ", " +
            "opacity " + Math.round(OPEN_MS * 0.6) + "ms ease";
          panel.style.width = "0px";
          panel.style.opacity = "0";
        });
        timer = window.setTimeout(settle, OPEN_MS + 40);
      }

      /** OPENING. On a wide window the panel grows out beside the
          writing on a measured width, for the same reason the parts
          themselves open on a measured height: the panel has to be on
          the page to be measured, and a width written here would be a
          second place to keep the stylesheet's number.

          ON A PHONE THERE IS NO ROOM BESIDE THE WRITING, so it comes up
          as a sheet from the foot of the window over a scrim. It is
          moved out to the BODY to do that: a fixed thing inside an
          ancestor carrying a transform is positioned against that
          ancestor rather than the window, and a part's own box is given
          a transform while it opens. */
      function openUp() {
        window.clearTimeout(timer);
        shown = true;
        asPopup = POPUP.matches;
        say(true);

        if (!asPopup) {
          if (panel.parentNode !== home) home.appendChild(panel);
          panel.hidden = false;
          if (REDUCE_MOTION) { moving = false; return; }
          moving = true;
          const to = panel.scrollWidth;
          panel.style.width = "0px";
          panel.style.opacity = "0";
          requestAnimationFrame(() => {
            panel.style.transition =
              "width " + OPEN_MS + "ms " + EASE + ", " +
              "opacity " + Math.round(OPEN_MS * 0.7) + "ms ease " +
                Math.round(OPEN_MS * 0.3) + "ms";
            panel.style.width = to + "px";
            panel.style.opacity = "1";
          });
          timer = window.setTimeout(() => {
            panel.style.transition = "";
            panel.style.width = "";
            panel.style.opacity = "";
            moving = false;
          }, OPEN_MS + 40);
          return;
        }

        // ONE AT A TIME as a popup: a second sheet over the first would
        // have nothing to go back to.
        if (openPopup && openPopup !== close) openPopup(true);
        openPopup = close;

        document.body.appendChild(panel);
        panel.classList.add("note-pop");
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.hidden = false;
        const sc = theScrim();
        sc.hidden = false;
        document.body.classList.add("note-holding");

        if (REDUCE_MOTION) {
          sc.classList.add("is-on");
          panel.classList.add("is-up");
          moving = false;
          return;
        }
        moving = true;
        // Two frames: one for the browser to take the sheet as being
        // where it starts from, one to move it.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            sc.classList.add("is-on");
            panel.classList.add("is-up");
          });
        });
        timer = window.setTimeout(() => { moving = false; }, POP_MS + 40);
      }

      button.addEventListener("click", () => {
        if (moving) return;
        if (shown) close(false); else openUp();
      });

      shutters.push(close);

      // THE NOTES GO WITH THE FRAGRANCE. Collapse a part and its notes
      // collapse with it, and opening the part again leaves them shut —
      // they have to be asked for again. Two listeners, because the two
      // things happen at different moments: the CLICK is when the reader
      // asked for it, and the part's own script then takes most of a
      // second to close the box, so the panel goes at once rather than
      // sitting there through the whole of it. The TOGGLE is the safety
      // net, for a part closed any other way.
      summary.addEventListener("click", () => {
        if (part.open && shown) close(true);
      });
      part.addEventListener("toggle", () => {
        if (!part.open && shown) close(true);
      });

      const shutter = panel.querySelector(".note-shut");
      if (shutter) shutter.addEventListener("click", () => close(false));
    });
  });

  // ESCAPE CLOSES THE SHEET, which anything standing over the page owes
  // the reader. It is only wired for the sheet: beside the writing the
  // panel is part of the page rather than over it, and escape there
  // would be taking something away that is not in the way.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" && event.key !== "Esc") return;
    if (openPopup) openPopup(false);
  });

  // AND THE WINDOW CHANGING WIDTH UNDER AN OPEN PANEL closes it. Turning
  // a phone on its side can take the page from a sheet to a column and
  // back; easing one open as the other would leave the panel laid out
  // one way and animated the other. Shutting it is the honest answer —
  // the button is right there.
  const changed = () => shutters.forEach((close) => close(true));
  if (POPUP.addEventListener) POPUP.addEventListener("change", changed);
  else if (POPUP.addListener) POPUP.addListener(changed);

  // WHAT IS MISSING, WHERE THE OWNER WILL SEE IT. Not on the page — in
  // the console, once, when there is something to say. Filling ninety
  // of these in is a job that will take several rounds, and knowing how
  // far it has got should not mean counting by hand.
  if (made) {
    const want = [];
    KINDS.forEach((kind) => {
      document.querySelectorAll("details." + kind.part).forEach((part) => {
        const no = (part.id.match(/(\d+)$/) || [])[1];
        const text = part.querySelector("." + kind.text);
        if (!no || !text || !text.querySelector("p, ul")) return;
        if (!ALL[KEY + ":" + no]) want.push(no);
      });
    });
    if (want.length) {
      // eslint-disable-next-line no-console
      console.info("[notes] " + KEY + ": " + (made - want.length) + " of " + made +
        " filled in. Still wanted: " + want.join(", "));
    }
  }
})();
