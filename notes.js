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
  const OPEN_MS = REDUCE_MOTION ? 0 : 420;

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
        '<div class="note-in">' + fill(entry) + "</div>";
      body.appendChild(panel);
      made += 1;

      let moving = false;

      /** OPENING AND CLOSING ON A MEASURED WIDTH, for the same reason
          the parts themselves open on a measured height: the panel has
          to be on the page to be measured, and a width written here
          would be a second place to keep the stylesheet's number. */
      button.addEventListener("click", () => {
        if (moving) return;
        const open = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", open ? "false" : "true");
        button.classList.toggle("is-on", !open);
        // THE PICTURE GIVES WAY, NOT THE WRITING. A part is a row of
        // three things once the panel is in it, in a column 940px
        // wide, and something has to be narrower. The first go let it
        // be the writing, which came out about 110px across — two
        // words to a line. So the part says it is showing notes and
        // the stylesheet takes the room off the plate instead.
        part.classList.toggle("notes-on", !open);

        if (REDUCE_MOTION) {
          panel.hidden = open;
          return;
        }

        moving = true;
        if (!open) {
          panel.hidden = false;
          const to = panel.scrollWidth;
          panel.style.width = "0px";
          panel.style.opacity = "0";
          requestAnimationFrame(() => {
            panel.style.transition =
              "width " + OPEN_MS + "ms cubic-bezier(0.42, 0.02, 0.24, 1), " +
              "opacity " + Math.round(OPEN_MS * 0.7) + "ms ease " +
                Math.round(OPEN_MS * 0.3) + "ms";
            panel.style.width = to + "px";
            panel.style.opacity = "1";
          });
          window.setTimeout(() => {
            panel.style.transition = "";
            panel.style.width = "";
            panel.style.opacity = "";
            moving = false;
          }, OPEN_MS + 40);
          return;
        }

        const from = panel.getBoundingClientRect().width;
        panel.style.width = from + "px";
        panel.style.opacity = "1";
        requestAnimationFrame(() => {
          panel.style.transition =
            "width " + OPEN_MS + "ms cubic-bezier(0.42, 0.02, 0.24, 1), " +
            "opacity " + Math.round(OPEN_MS * 0.6) + "ms ease";
          panel.style.width = "0px";
          panel.style.opacity = "0";
        });
        window.setTimeout(() => {
          panel.hidden = true;
          panel.style.transition = "";
          panel.style.width = "";
          panel.style.opacity = "";
          moving = false;
        }, OPEN_MS + 40);
      });
    });
  });

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
