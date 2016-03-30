@include font-face('<%= fontName %>', '<%= fontName %>/<%= fontName %>', 400, normal, eot woff ttf svg);

[class^="<%= prefix %>"], [class*=" <%= prefix %>"] {
  font-family: '<%= fontName %>';
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  @include font-smoothing;
}

.icon-large {
  @include size(70%, 70%);
}

<% _.each(glyphs, function(glyph) { %>.<%= prefix %><%= glyph.name %>:before { content: "\<%= glyph.codepoint.toString(16).toUpperCase() %>" }
<% }); %>