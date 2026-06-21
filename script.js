/**
 * 出張買取サービス LP スクリプト
 * 主な機能：
 * 1. ヘッダーの高さを考慮したスムーズスクロール
 * 2. FAQアコーディオンの排他制御（親切設計）
 * 3. フォームのバリデーションと疑似送信処理、完了メッセージ表示
 * 4. スクロール連動フェードインアニメーションのフォールバック (IntersectionObserver)
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // 1. スムーズスクロール (固定ヘッダーの高さを考慮)
  // ==========================================================================
  const scrollLinks = document.querySelectorAll('a[href^="#"]');
  const siteHeader = document.querySelector('.site-header');

  scrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // デフォルトのアンカー移動（急なジャンプ）をキャンセル
      e.preventDefault();

      const targetId = link.getAttribute('href');
      if (targetId === '#' || !targetId) return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // 固定ヘッダーの高さを取得（レスポンシブで変動するため毎回計測）
        const headerHeight = siteHeader ? siteHeader.offsetHeight : 0;
        
        // ターゲット要素の位置を計算し、ヘッダーの高さ分引く
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerHeight - 15; // 少し余白（15px）を追加

        // 滑らかにスクロールさせる
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });


  // ==========================================================================
  // 2. FAQアコーディオンの排他開閉制御 (1つ開いたら他を閉じる)
  // ==========================================================================
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const summary = item.querySelector('summary');
    summary.addEventListener('click', (e) => {
      // ユーザーがクリックしたときに、他のFAQが開いていれば閉じる
      if (!item.hasAttribute('open')) {
        faqItems.forEach(otherItem => {
          if (otherItem !== item && otherItem.hasAttribute('open')) {
            otherItem.removeAttribute('open');
          }
        });
      }
    });
  });


  // ==========================================================================
  // 3. フォームバリデーション & 疑似送信処理
  // ==========================================================================
  const inquiryForm = document.getElementById('inquiry-form');
  const successMessage = document.getElementById('form-success-message');

  if (inquiryForm && successMessage) {
    
    // 入力時にリアルタイムでARIA属性を同期させる
    const syncAriaInvalid = (el) => {
      // inputにフォーカスが外れた、あるいは入力されたときに、ブラウザの有効性をチェック
      const isValid = el.checkValidity();
      el.setAttribute('aria-invalid', isValid ? 'false' : 'true');
    };

    // フォーム内のテキスト入力欄とテキストエリアを監視
    const formInputs = inquiryForm.querySelectorAll('input[required], textarea[required]');
    formInputs.forEach(input => {
      input.addEventListener('blur', () => {
        // ユーザーがフィールドから離れたときにバリデーションを実行
        syncAriaInvalid(input);
      });
      input.addEventListener('input', () => {
        // 入力中にもエラーが解消されたか随時チェック
        if (input.getAttribute('aria-invalid') === 'true') {
          syncAriaInvalid(input);
        }
      });
    });

    // フォーム送信処理
    inquiryForm.addEventListener('submit', (e) => {
      // デフォルトのページ遷移送信を防ぐ
      e.preventDefault();

      // フォーム全体のバリデーションチェック
      const isFormValid = inquiryForm.checkValidity();

      if (isFormValid) {
        // すべての入力項目が正しい場合、フェードアウトして完了メッセージを表示
        inquiryForm.style.display = 'none';
        successMessage.style.display = 'block';

        // 完了メッセージに画面のフォーカスを移動（アクセシビリティ向上）
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // 入力項目にエラーがある場合
        // すべての必須項目に :user-invalid に相当するマークをつけてエラー表示を強制する
        formInputs.forEach(input => {
          syncAriaInvalid(input);
          
          // ブラウザのデフォルトの吹き出しエラーを抑制し、独自デザインのエラーメッセージのみを表示する
          // 送信ボタンが押されたことで、CSSの :user-invalid が有効化されます
        });

        // 最初にエラーになった入力項目を見つけてフォーカスを当てる
        const firstInvalidInput = inquiryForm.querySelector('input:invalid, textarea:invalid');
        if (firstInvalidInput) {
          firstInvalidInput.focus();
        }
      }
    });
  }


  // ==========================================================================
  // 4. スクロールフェードインアニメーション (IntersectionObserverによるフォールバック)
  // ==========================================================================
  // CSSの Scroll-driven animations に非対応のブラウザのみJavaScriptで動作させる
  const hasNativeScrollTimeline = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

  if (!hasNativeScrollTimeline) {
    const fadeElements = document.querySelectorAll('.scroll-fade');

    // 画面の3割程度（下部から70%の位置）に入ったら表示させる設定
    const observerOptions = {
      root: null, // ビューポートを基準にする
      rootMargin: '0px 0px -15% 0px',
      threshold: 0.1 // 10%が見えたら発火
    };

    const fadeObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 画面内に入ったら active クラスを付与し、CSSでフェードインさせる
          entry.target.classList.add('active');
          // 一度表示されたら監視を終了する（パフォーマンス向上）
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    fadeElements.forEach(el => {
      fadeObserver.observe(el);
    });
  }
});
