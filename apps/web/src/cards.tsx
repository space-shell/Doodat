/* @refresh reload */
import { render } from 'solid-js/web';
import CardBrowser from './components/browse/CardBrowser';
import './index.css';

const root = document.getElementById('root');

render(() => <CardBrowser />, root!);
