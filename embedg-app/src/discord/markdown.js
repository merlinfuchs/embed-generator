import markdown from "simple-markdown";
import highlight from "highlight.js/lib/common";
import { formatDistanceToNow } from "date-fns";

// https://github.com/ItzDerock/discord-markdown-parser
// https://github.com/brussell98/discord-markdown

function htmlTag(tagName, content, attributes, isClosed = true, state = {}) {
  if (typeof isClosed === "object") {
    state = isClosed;
    isClosed = true;
  }

  if (!attributes) attributes = {};

  if (attributes.class && state.cssModuleNames)
    attributes.class = attributes.class
      .split(" ")
      .map((cl) => state.cssModuleNames[cl] || cl)
      .join(" ");

  let attributeString = "";
  for (let attr in attributes) {
    // Removes falsy attributes
    if (
      Object.prototype.hasOwnProperty.call(attributes, attr) &&
      attributes[attr]
    )
      attributeString += ` ${markdown.sanitizeText(
        attr
      )}="${markdown.sanitizeText(attributes[attr])}"`;
  }

  let unclosedTag = `<${tagName}${attributeString}>`;

  if (isClosed) return unclosedTag + content + `</${tagName}>`;
  return unclosedTag;
}
markdown.htmlTag = htmlTag;

const titleRules = {
  newline: markdown.defaultRules.newline,
  escape: markdown.defaultRules.escape,
  em: Object.assign({}, markdown.defaultRules.em, {
    parse: function (capture, parse, state) {
      const parsed = markdown.defaultRules.em.parse(
        capture,
        parse,
        Object.assign({}, state, { inEmphasis: true })
      );
      return state.inEmphasis ? parsed.content : parsed;
    },
  }),
  strong: markdown.defaultRules.strong,
  u: markdown.defaultRules.u,
  strike: Object.assign({}, markdown.defaultRules.del, {
    match: markdown.inlineRegex(/^~~([\s\S]+?)~~(?!_)/),
  }),
  inlineCode: Object.assign({}, markdown.defaultRules.inlineCode, {
    match: (source) =>
      markdown.defaultRules.inlineCode.match.regex.exec(source),
    html: function (node, output, state) {
      return htmlTag(
        "code",
        markdown.sanitizeText(node.content.trim()),
        null,
        state
      );
    },
  }),
  text: Object.assign({}, markdown.defaultRules.text, {
    match: (source) =>
      /^[\s\S]+?(?=[^0-9A-Za-z\s\u00c0-\uffff-]|\n\n|\n|\w+:\S|$)/.exec(source),
    html: function (node, output, state) {
      if (state.escapeHTML) return markdown.sanitizeText(node.content);

      return node.content;
    },
  }),
  emoticon: {
    order: markdown.defaultRules.text.order,
    match: (source) => /^(¯\\_\(ツ\)_\/¯)/.exec(source),
    parse: function (capture) {
      return {
        type: "text",
        content: capture[1],
      };
    },
    html: function (node, output, state) {
      return output(node.content, state);
    },
  },
  br: Object.assign({}, markdown.defaultRules.br, {
    match: markdown.anyScopeRegex(/^\n/),
  }),
  spoiler: {
    order: 0,
    match: (source) => /^\|\|([\s\S]+?)\|\|/.exec(source),
    parse: function (capture, parse, state) {
      return {
        content: parse(capture[1], state),
      };
    },
    html: function (node, output, state) {
      return htmlTag(
        "span",
        output(node.content, state),
        { class: "discord-spoiler" },
        state
      );
    },
  },

  discordEmoji: {
    order: markdown.defaultRules.strong.order,
    match: (source) => /^<(a?):(\w+):(\d+)>/.exec(source),
    parse: function (capture) {
      return {
        animated: capture[1] === "a",
        name: capture[2],
        id: capture[3],
      };
    },
    html: function (node, output, state) {
      return htmlTag(
        "div",
        htmlTag(
          "img",
          "",
          {
            class: "discord-custom-emoji-image",
            src: `https://cdn.discordapp.com/emojis/${node.id}.${
              node.animated ? "gif" : "png"
            }`,
            title: `:${node.name}:`,
            alt: `:${node.name}:`,
          },
          false,
          state
        ),
        {
          class: "discord-custom-emoji",
        },
        state
      );
    },
  },

  messageVariable: {
    order: markdown.defaultRules.strong.order,
    match: (source) => /^\{\{([^}]+)\}\}/.exec(source),
    parse: function (capture, parse, state) {
      return {
        content: parse(capture[1], state),
      };
    },
    html: function (node, output, state) {
      return htmlTag(
        "span",
        output(node.content, state),
        { class: "message-variable" },
        state
      );
    },
  },
};

const bodyRules = {
  ...titleRules,
  blockQuote: Object.assign({}, markdown.defaultRules.blockQuote, {
    match: function (source, state, prevSource) {
      return !/^$|\n *$/.test(prevSource) || state.inQuote
        ? null
        : /^( *>>> ([\s\S]*))|^( *> [^\n]*(\n *> [^\n]*)*\n?)/.exec(source);
    },
    parse: function (capture, parse, state) {
      const all = capture[0];
      const isBlock = Boolean(/^ *>>> ?/.exec(all));
      const removeSyntaxRegex = isBlock ? /^ *>>> ?/ : /^ *> ?/gm;
      const content = all.replace(removeSyntaxRegex, "");

      return {
        content: parse(content, Object.assign({}, state, { inQuote: true })),
      };
    },
    html: (node, output, state) => {
      return htmlTag(
        "div",
        htmlTag("div", "", { class: "discord-quote-divider" }, state) +
          htmlTag("blockquote", output(node.content, state), {}, state),
        { class: "discord-quote-container" },
        state
      );
    },
  }),
  codeBlock: Object.assign({}, markdown.defaultRules.codeBlock, {
    match: markdown.inlineRegex(/^```(([a-z0-9-]+?)\n+)?\n*([^]+?)\n*```/i),
    parse: function (capture, parse, state) {
      return {
        lang: (capture[2] || "").trim(),
        content: capture[3] || "",
        inQuote: state.inQuote || false,
      };
    },
    html: (node, output, state) => {
      let code;
      if (node.lang && highlight.getLanguage(node.lang))
        code = highlight.highlight(node.content, {
          language: node.lang,
          ignoreIllegals: true,
        }); // Discord seems to set ignoreIllegals: true

      if (code && state.cssModuleNames)
        // Replace classes in hljs output
        code.value = code.value.replace(
          /<span class="([a-z0-9-_ ]+)">/gi,
          (str, m) =>
            str.replace(
              m,
              m
                .split(" ")
                .map((cl) => state.cssModuleNames[cl] || cl)
                .join(" ")
            )
        );

      return htmlTag(
        "pre",
        htmlTag(
          "code",
          code ? code.value : markdown.sanitizeText(node.content),
          {
            class: `hljs${code ? " " + code.language : ""}`,
            style: "padding: 8px;",
          },
          state
        ),
        { style: "background-color: #2f3136; margin-top: 6px" },
        state
      );
    },
  }),
  link: Object.assign({}, markdown.defaultRules.link, {
    html: (node, output, state) => {
      var attributes = {
        href: markdown.sanitizeUrl(node.target),
        title: node.title,
        target: "_blank",
      };

      return htmlTag("a", output(node.content, state), attributes, state);
    },
  }),
  autolink: Object.assign({}, markdown.defaultRules.autolink, {
    parse: (capture) => {
      return {
        content: [
          {
            type: "text",
            content: capture[1],
          },
        ],
        target: capture[1],
      };
    },
    html: (node, output, state) => {
      return htmlTag(
        "a",
        output(node.content, state),
        { href: markdown.sanitizeUrl(node.target), target: "_blank" },
        state
      );
    },
  }),
  url: Object.assign({}, markdown.defaultRules.url, {
    parse: (capture) => {
      return {
        content: [
          {
            type: "text",
            content: capture[1],
          },
        ],
        target: capture[1],
      };
    },
    html: (node, output, state) => {
      return htmlTag(
        "a",
        output(node.content, state),
        { href: markdown.sanitizeUrl(node.target), target: "_blank" },
        state
      );
    },
  }),
  heading: Object.assign({}, markdown.defaultRules.heading, {
    match: function (source, state) {
      if (
        state.prevCapture === null ||
        state.prevCapture[state.prevCapture.length - 1] === "\n"
      ) {
        const re = /^(#{1,3}) +([^\n]+?)(\n|$)/;
        return re.exec(source);
      }
      return null;
    },
  }),
  subtext: {
    order: markdown.defaultRules.heading.order,
    match: (source, state) => state.prevCapture === null ||
      state.prevCapture[state.prevCapture.length - 1] === "\n" ? /^ *-# +((?!(-#)+)[^\n]+?) *(\n|$)/.exec(source) : null,
    parse: function(capture) {
      return {
        content: capture[1].trim(),
      };
    },
    html: function(node) {
      return htmlTag("small", node.content);
    },
  },
  list: Object.assign({}, markdown.defaultRules.list, {
    match: function (source, state, prevCapture) {
      state._list = true;
      return markdown.defaultRules.list.match(source, state, prevCapture);
    },
  }),

  discordUser: {
    order: markdown.defaultRules.strong.order,
    match: (source) => /^<@!?([0-9]*)>/.exec(source),
    parse: function (capture) {
      return {
        id: capture[1],
      };
    },
    html: function (node, output, state) {
      return htmlTag(
        "span",
        state.discordCallback.user(node),
        { class: "discord-mention discord-user-mention" },
        state
      );
    },
  },
  discordChannel: {
    order: markdown.defaultRules.strong.order,
    match: (source) => /^<#?([0-9]*)>/.exec(source),
    parse: function (capture) {
      return {
        id: capture[1],
      };
    },
    html: function (node, output, state) {
      return htmlTag(
        "span",
        state.discordCallback.channel(node),
        { class: "discord-mention" },
        state
      );
    },
  },
  discordRole: {
    order: markdown.defaultRules.strong.order,
    match: (source) => /^<@&([0-9]*)>/.exec(source),
    parse: function (capture) {
      return {
        id: capture[1],
      };
    },
    html: function (node, output, state) {
      return htmlTag(
        "span",
        state.discordCallback.role(node),
        { class: "discord-mention discord-role-mention" },
        state
      );
    },
  },
  discordEveryone: {
    order: markdown.defaultRules.strong.order,
    match: (source) => /^@everyone/.exec(source),
    parse: function () {
      return {};
    },
    html: function (node, output, state) {
      return htmlTag(
        "span",
        state.discordCallback.everyone(node),
        { class: "discord-mention discord-role-mention" },
        state
      );
    },
  },
  discordHere: {
    order: markdown.defaultRules.strong.order,
    match: (source) => /^@here/.exec(source),
    parse: function () {
      return {};
    },
    html: function (node, output, state) {
      return htmlTag(
        "span",
        state.discordCallback.here(node),
        { class: "discord-mention discord-role-mention" },
        state
      );
    },
  },
  discordTimestamp: {
    order: markdown.defaultRules.strong.order,
    match: (source) => /^<t:(\d+)(?::([a-zA-Z]))?>/.exec(source),
    parse: function (capture) {
      return {
        timestamp: parseInt(capture[1], 10),
        format: capture[2] || "f",
      };
    },
    html: function (node, output, state) {
      const date = new Date(node.timestamp * 1000);
      const options = {
        t: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        T: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        d: date.toLocaleDateString([], { year: "numeric", month: "2-digit", day: "2-digit" }),
        D: date.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
        f: date.toLocaleString([], { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        F: date.toLocaleString([], { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        R: formatDistanceToNow(date, { addSuffix: true }),
      };
      const formattedDate = options[node.format] || options.f;
      return htmlTag(
        "span",
        formattedDate,
        { class: "discord-timestamp" },
        state
      );
    },
  },
};

const discordCallbackDefaults = {
  user: (node) => "@" + markdown.sanitizeText(node.id),
  channel: (node) => "#" + markdown.sanitizeText(node.id),
  role: (node) => "@" + markdown.sanitizeText(node.id),
  everyone: () => "@everyone",
  here: () => "@here",
};

const parserTitle = markdown.parserFor(titleRules);
const htmlOutputTitle = markdown.outputFor(titleRules, "html");

const parseBody = markdown.parserFor(bodyRules);
const htmlOutputBody = markdown.outputFor(bodyRules, "html");

/**
 * Parse markdown and return the HTML output
 * @param {String} source Source markdown content
 * @param {Object} [options] Options for the parser
 * @param {Boolean} [options.isTitle=false] Parse as embed content
 * @param {Object} [options.cssModuleNames] An object mapping css classes to css module classes
 */
export function toHTML(source, options) {
  options = Object.assign(
    {
      isTitle: false,
      discordCallback: {},
    },
    options || {}
  );

  let _parser = parseBody;
  let _htmlOutput = htmlOutputBody;
  if (options.isTitle) {
    _parser = parserTitle;
    _htmlOutput = htmlOutputTitle;
  }

  const state = {
    inline: true,
    inQuote: false,
    inEmphasis: false,
    escapeHTML: true,
    cssModuleNames: options.cssModuleNames || null,
    discordCallback: Object.assign(
      {},
      discordCallbackDefaults,
      options.discordCallback
    ),
  };

  return _htmlOutput(_parser(source, state), state);
}
