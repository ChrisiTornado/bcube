/**
 * Shared inline button style maps repeated across auth and dashboard templates.
 * PrimeNG's [style] input takes a plain style object, so these are intentionally not CSS classes.
 */
export const DARK_BUTTON_STYLE: { [key: string]: string } = {
  'background-color': 'black',
  'border-color': 'black',
  'color': 'white'
};

export const LIGHT_BUTTON_STYLE: { [key: string]: string } = {
  'background-color': 'white',
  'border-color': 'black',
  'color': 'black'
};
