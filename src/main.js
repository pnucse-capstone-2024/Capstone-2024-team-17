import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { store } from './store/store'; // store.js 불러오기

// 애플리케이션에 router와 store를 함께 등록
createApp(App)
  .use(router)
  .use(store)  // Vuex store 사용
  .mount('#app');
