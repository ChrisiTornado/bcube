import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;

  beforeEach(() => {
    pipe = new MarkdownPipe();
  });

  it('returns an empty string for null, undefined or empty input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('wraps a single line in a paragraph', () => {
    expect(pipe.transform('Hello world')).toBe('<p>Hello world</p>');
  });

  it('joins consecutive lines within a paragraph with <br>', () => {
    expect(pipe.transform('Line one\nLine two')).toBe('<p>Line one<br>Line two</p>');
  });

  it('splits paragraphs on a blank line', () => {
    expect(pipe.transform('First\n\nSecond')).toBe('<p>First</p><p>Second</p>');
  });

  it('renders "-" and "*" bullet lines as a <ul>', () => {
    expect(pipe.transform('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
    expect(pipe.transform('* one\n* two')).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  it('closes a list when a paragraph line follows it', () => {
    const result = pipe.transform('- one\n- two\nback to text');
    expect(result).toBe('<ul><li>one</li><li>two</li></ul><p>back to text</p>');
  });

  it('renders **bold** and __bold__ as <strong>', () => {
    expect(pipe.transform('**bold**')).toBe('<p><strong>bold</strong></p>');
    expect(pipe.transform('__bold__')).toBe('<p><strong>bold</strong></p>');
  });

  it('renders *italic* and _italic_ as <em>', () => {
    expect(pipe.transform('*italic*')).toBe('<p><em>italic</em></p>');
    expect(pipe.transform('_italic_')).toBe('<p><em>italic</em></p>');
  });

  it('escapes HTML-significant characters before formatting', () => {
    expect(pipe.transform('<script>&</script>')).toBe('<p>&lt;script&gt;&amp;&lt;/script&gt;</p>');
  });

  it('trims leading/trailing whitespace on each line', () => {
    expect(pipe.transform('   padded text   ')).toBe('<p>padded text</p>');
  });
});
