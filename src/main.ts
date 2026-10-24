import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { device } from './lib/device.svelte';
import { i18n } from './lib/i18n/i18n.svelte';
import { theme } from './lib/theme.svelte';
import { demoModel } from './lib/transport/demo';

theme.apply();
await i18n.init();
const demo = demoModel(new URLSearchParams(location.search).get('demo'));
if (demo) void device.connectDemo(demo);
else void device.autoConnect();

export default mount(App, { target: document.getElementById('app')! });
