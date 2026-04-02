import { render } from 'preact';
import { VERSION } from '@kurikulum/core';
import './styles.css';

function Course() {
  return (
    <div>
      <h1>Kurikulum Template</h1>
      <p>Core version: {VERSION}</p>
    </div>
  );
}

render(<Course />, document.getElementById('app')!);
