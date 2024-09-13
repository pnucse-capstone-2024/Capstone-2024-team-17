import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';

export const store = createStore({
  state: {
    coffeeProductions: [] // Seller가 입력한 데이터를 저장
  },
  mutations: {
    addProduction(state, production) {
      state.coffeeProductions.push(production); // 데이터 추가
    },
    removeProduction(state, index) {
      state.coffeeProductions.splice(index, 1); // 인덱스에 해당하는 데이터를 제거
    },
    markProductionAsProcessed(state, index) {
      state.coffeeProductions[index].processed = true; // 인덱스에 해당하는 데이터를 처리 완료 상태로 변경
    }
  },
  actions: {
    addCoffeeProduction({ commit }, production) {
      commit('addProduction', production);
    },
    deleteCoffeeProduction({ commit }, index) {
      commit('removeProduction', index);
    },
    processCoffeeProduction({ commit }, index) {
      commit('markProductionAsProcessed', index);
    }
  },
  getters: {
    getCoffeeProductions: state => {
      return state.coffeeProductions; // 모든 데이터 조회
    }
  },
  plugins: [createPersistedState()] // vuex-persistedstate 플러그인 추가
});
