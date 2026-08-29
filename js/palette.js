// NES master palette subset. Every sprite/background pixel must use one of these keys.
// '.' means transparent and is NOT in this table.
export const PALETTE = {
  '0': '#000000', // black
  '1': '#1d1d1d', // near black
  'D': '#3f3f3f', // dark gray
  'G': '#7c7c7c', // gray
  'L': '#bcbcbc', // light gray
  'W': '#fcfcfc', // white

  'r': '#a81000', // dark red
  'R': '#f83800', // red
  'o': '#e45c10', // orange
  'O': '#fca044', // light orange
  'y': '#ac7c00', // dark gold
  'Y': '#f8b800', // gold/yellow
  'x': '#f8d878', // pale yellow

  'g': '#005800', // dark green
  'E': '#00a800', // green
  'e': '#b8f818', // light green

  'b': '#000088', // dark blue
  'B': '#0058f8', // blue
  'c': '#3cbcfc', // light blue / cyan
  'C': '#a4e4fc', // pale cyan

  'p': '#4428bc', // dark purple
  'P': '#9878f8', // purple
  'm': '#a80020', // dark magenta/maroon
  'M': '#f85898', // pink/magenta

  'n': '#503000', // dark brown
  'N': '#885000', // brown
  'T': '#c08454', // tan (skin mid)
  'S': '#f0bc8c', // skin light
  's': '#a05820', // skin shadow / dark tan
  'q': '#7c3800', // deep brown-red
};
