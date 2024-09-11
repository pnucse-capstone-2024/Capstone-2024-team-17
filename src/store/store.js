import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';

export const store = createStore({
  state: {
    coffeeProductions: [] // Seller가 입력한 데이터를 저장
  },
  mutations: {
    addProduction(state, production) {
      state.coffeeProductions.push(production); // 데이터 추가
    }
  },
  getters: {
    getCoffeeProductions: state => {
      return state.coffeeProductions; // 모든 데이터 조회
    }
  },
  plugins: [createPersistedState()] // vuex-persistedstate 플러그인 추가
});
