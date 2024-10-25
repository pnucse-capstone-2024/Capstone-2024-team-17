### 1. 프로젝트 소개
#### 1.1. 배경 및 필요성
커피 원두는 일반적으로 원산지를 기반으로 마케팅되며, 각 지역은 고유한 맛과 특성을 가진 커피를 생산하는 것으로 알려져 있다. 그러나 현재까지는 수작업을 통하여 원산지를 추적했기 때문에, 품질이 낮은 지역의 원두를 유명한 커피 재배 지역의 프리미엄 원두로 거짓 라벨링하여 높은 가격을 책정하는 문제가 발생하고 있다. 또한 농부에서부터 수출입업자, 도소매 업체 등 다분화된 공급망은 원산지와 품질을 검증하는 것을 어려워지게 하는 것에 동조하여 신뢰성 낮춘다. 그리고 커피의  소비자뿐만 아니라 농부들 역시 투명성 및 시장 정보 부족으로 공정한 가격을 받지 못하여, 커피 농부들의 생계뿐만 아니라 커피 공급망의 전반에 품질과 지속 가능성에도 영향을 미친다.


#### 1.2. 목표 및 주요 내용
본 연구에서는 커피 물류 관리 시스템을 구축하는 과정에서 기존 시스템의 부정확한 원산지 추적과 복잡한 공급망 구조로 인한 품질 검증 부족 문제를 블록체인과 스마트 컨트랙트 기술을 활용하여 원산지 정보를 안전하게 저장하고 복잡한 공급망을 간소화 함으로써 해결하고자 한다.


### 2. 상세설계
#### 2.1. 시스템 구성도
<img src="https://github.com/user-attachments/assets/359a3b11-e64e-4e7c-932f-1b8fed4f8074" alt="시스템 구성도" width="600" />


#### 2.1. 사용 기술
- 프로그래밍 언어: Solidity 0.7.1, JavaScript
- 프레임워크 및 라이브러리: Vue.js (Vue 3)
- 개발 도구: Ganache v2.7.1, Remix IDE v0.7.1


### 3. 설치 및 사용 방법
### a. For detailed usage instructions regarding **Smart Contract Deployment**, please refer to the pdf file below.

[커피와컴 사용설명서.pdf](https://github.com/user-attachments/files/17349683/default.pdf)

### b. Before running the project, make sure to install the necessary packages. There are two types of installations: **global** and **local**. Please follow the instructions below to set up your environment correctly.

   #### 1. Global Installation (can be run from any directory)

   The following commands need to be run globally to make Vue CLI and Vue available across your entire system:

   #### `npm install vue -g`  
   #### `npm install @vue/cli -g`

   These commands install `vue` and `@vue/cli` globally, allowing you to use Vue commands like `vue create` from anywhere in your terminal.

   #### 2. Local Installation (must be run in the project directory)

   The following commands should be executed in the root directory of your project (`CoffeeBean-main`), where the `package.json` file is located:

   1. Navigate to your project directory:

      Example: `cd "C:\Users\username\OneDrive\바탕 화면\vue_projects\CoffeeBean-main"`

   2. Then run the local installation commands:

      #### `npm install axios`  
      #### `npm install vue-router`  
      #### `npm install web3`
      #### `npm install vuex`
      #### `npm install vuex-persistedstate`

   #### 3. Running the Project

   In the project directory, you can run:

   #### `npm run serve`

   This command starts the development server, and you can view the project in your browser at `http://localhost:8080`.


### 4. 소개 및 시연 영상
> 프로젝트에 대한 소개와 시연 영상을 넣으세요.

### 5. 팀 소개
#### 조주영 (201924586, 전기컴퓨터공학부-정보컴퓨터공학전공)
- 역할: UI/UX 설계, Vue.js를 통한 플랫폼 개발
- 이메일: chojuyoung0926@naver.com

#### 김영목 (201924436, 전기컴퓨터공학부-정보컴퓨터공학전공)
- 역할: Remix IDE를 통한 체인코드 개발, Web3를 통한 백엔드 서버 연동
- 이메일: rladudahr4@naver.com

#### 장영철 (201941171, 무역학부)
- 역할: Remix IDE를 통한 체인코드 개발, 블록체인 네트워크 구축
- 이메일: jyc3046@gmail.com