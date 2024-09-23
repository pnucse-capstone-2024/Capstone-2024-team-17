import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';

export const store = createStore({
  state: {
    coffeeProductions: [], // Seller가 입력한 데이터를 저장
    confirmedProductions: []
  },
  mutations: {
    addProduction(state, production) {
      state.coffeeProductions.push(production); // 데이터 추가
    },
    removeProduction(state, index) {
      state.coffeeProductions.splice(index, 1); // 인덱스에 해당하는 데이터를 제거
    },
    confirmProduction(state, product) {
      // 기존 상품이 있는지 확인
      const existingProduct = state.confirmedProductions.find(
        item => item.coffeeName === product.coffeeName && item.beanType === product.beanType
      );
    
      if (existingProduct) {
        // 기존 상품이 있으면 수량을 누적
        existingProduct.quantity += product.quantity;
      } else {
        // 기존 상품이 없으면 새로운 상품 추가
        state.confirmedProductions.push(product);
      }
    },
    removeConfirmedProduction(state, product) {
      const index = state.confirmedProductions.findIndex(item =>
        item.coffeeName === product.coffeeName && item.beanType === product.beanType
      );
      if (index !== -1) {
        state.confirmedProductions.splice(index, 1); // 데이터 삭제
      }
    },
    updateConfirmedProductionQuantity(state, { coffeeName, beanType, newQuantity }) {
      const product = state.confirmedProductions.find(
        item => item.coffeeName === coffeeName && item.beanType === beanType
      );
      if (product) {
        product.quantity = newQuantity;
      }
    }
  },
  actions: {
    addCoffeeProduction({ commit }, production) {
      commit('addProduction', production);
    },
    deleteCoffeeProduction({ commit }, index) {
      commit('removeProduction', index);
    },
    confirmCoffeeProduction({ commit }, product) {
      commit('confirmProduction', product);
    },
    deleteConfirmedProduction({ commit }, product) {
      commit('removeConfirmedProduction', product); // Vuex 상태에서 삭제
    },
    updateConfirmedProductionQuantity({ commit }, payload) {
      commit('updateConfirmedProductionQuantity', payload);
    }
  },
  getters: {
    getCoffeeProductions: state => {
      return state.coffeeProductions; // 모든 데이터 조회
    },
    getConfirmedProductions: state => {
      return state.confirmedProductions; // 모든 데이터 조회
    }
  },
  plugins: [createPersistedState()] // vuex-persistedstate 플러그인 추가
});
