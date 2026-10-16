
(() => {
  const OLD_ID = 'board-paste-gui';
  document.getElementById(OLD_ID)?.remove();

  const host = document.createElement('div');
  host.id = OLD_ID;
  host.style.cssText = `
    position: fixed;
    top: 80px;
    right: 25px;
    width: 420px;
    max-width: calc(100vw - 30px);
    z-index: 2147483647;
    font-family: Arial, sans-serif;
  `;

  const shadow = host.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
      * { box-sizing: border-box; }

      .panel {
        background: #fff;
        color: #222;
        border-radius: 14px;
        box-shadow: 0 8px 35px #0004;
        overflow: hidden;
        border: 1px solid #ddd;
      }

      .header {
        background: linear-gradient(135deg, #6574df, #9b6cdb);
        color: white;
        padding: 15px;
        font-size: 16px;
        font-weight: bold;
        cursor: move;
        display: flex;
        justify-content: space-between;
        user-select: none;
      }

      .close {
        border: none;
        background: transparent;
        color: white;
        font-size: 22px;
        cursor: pointer;
      }

      .body { padding: 16px; }

      label {
        display: block;
        font-size: 13px;
        font-weight: bold;
        margin-bottom: 6px;
      }

      input, textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 7px;
        font: 13px Arial, sans-serif;
        margin-bottom: 12px;
        background: #fff;
        color: #222;
      }

      textarea {
        height: 220px;
        resize: vertical;
        line-height: 1.5;
      }

      input:focus, textarea:focus {
        border-color: #6574df;
        outline: none;
      }

      .buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      button {
        padding: 10px;
        border: none;
        border-radius: 7px;
        cursor: pointer;
        font-weight: bold;
      }

      .primary {
        background: #6574df;
        color: white;
      }

      .secondary {
        background: #edf0ff;
        color: #4654ad;
      }

      .danger {
        background: #fff0f0;
        color: #be4242;
      }

      .full { grid-column: span 2; }

      .status {
        margin-top: 12px;
        font-size: 12px;
        color: #666;
        text-align: center;
        min-height: 16px;
      }

      button:hover { filter: brightness(.95); }
    </style>

    <div class="panel">
      <div class="header" id="drag">
        <span>게시판 입력 도구</span>
        <button class="close" id="close">×</button>
      </div>

      <div class="body">
        <label>게시글 제목</label>
        <input id="title" placeholder="제목을 입력하세요">

        <label>게시글 본문</label>
        <textarea id="content"
          placeholder="본문을 입력하거나 붙여넣으세요"></textarea>

        <div class="buttons">
          <button class="secondary" id="pasteTitle">
            제목 붙여넣기
          </button>

          <button class="secondary" id="pasteContent">
            본문 붙여넣기
          </button>

          <button class="primary full" id="apply">
            제목 + 본문 게시판에 적용
          </button>

          <button class="secondary" id="read">
            현재 게시글 불러오기
          </button>

          <button class="secondary" id="copy">
            전체 내용 복사
          </button>

          <button class="danger full" id="clear">
            입력 내용 초기화
          </button>
        </div>

        <div class="status" id="status">준비 완료</div>
      </div>
    </div>
  `;

  document.body.appendChild(host);

  const $ = id => shadow.getElementById(id);

  const title = $('title');
  const content = $('content');
  const status = $('status');

  const notify = msg => {
    status.textContent = msg;
  };

  function setNativeValue(el, value) {
    const prototype = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;

    const setter = Object.getOwnPropertyDescriptor(
      prototype, 'value'
    ).set;

    setter.call(el, value);

    el.dispatchEvent(new Event('input', {
      bubbles: true
    }));

    el.dispatchEvent(new Event('change', {
      bubbles: true
    }));
  }

  async function pasteInto(el) {
    try {
      const text = await navigator.clipboard.readText();
      el.value = text;
      notify('클립보드에서 가져왔습니다.');
    } catch (err) {
      notify('클립보드 접근이 차단되었습니다. Ctrl+V를 이용하세요.');
      el.focus();
    }
  }

  $('pasteTitle').onclick = () => pasteInto(title);
  $('pasteContent').onclick = () => pasteInto(content);

  $('apply').onclick = () => {
    const targetTitle = document.getElementById('pt_title');
    const targetContent = document.getElementById('pt_content');

    if (!targetTitle || !targetContent) {
      notify('게시판 입력창을 찾을 수 없습니다.');
      return;
    }

    setNativeValue(targetTitle, title.value);
    setNativeValue(targetContent, content.value);

    const success =
      targetTitle.value === title.value &&
      targetContent.value === content.value;

    notify(success
      ? '제목과 본문 입력 완료! 등록 전 내용을 확인하세요.'
      : '입력값이 일치하지 않습니다. 확인이 필요합니다.'
    );
  };

  $('read').onclick = () => {
    title.value =
      document.getElementById('pt_title')?.value ?? '';

    content.value =
      document.getElementById('pt_content')?.value ?? '';

    notify('현재 게시판 내용을 불러왔습니다.');
  };

  $('copy').onclick = async () => {
    const text =
      title.value + '\n\n' + content.value;

    try {
      await navigator.clipboard.writeText(text);
      notify('전체 내용을 복사했습니다.');
    } catch (err) {
      notify('복사 권한이 없어 실패했습니다.');
    }
  };

  $('clear').onclick = () => {
    title.value = '';
    content.value = '';
    notify('GUI 입력 내용을 초기화했습니다.');
  };

  $('close').onclick = () => host.remove();

  // 드래그 이동
  let moving = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  const drag = $('drag');

  drag.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;

    const rect = host.getBoundingClientRect();

    initialLeft = rect.left;
    initialTop = rect.top;
    startX = e.clientX;
    startY = e.clientY;

    moving = true;

    host.style.left = initialLeft + 'px';
    host.style.top = initialTop + 'px';
    host.style.right = 'auto';

    drag.setPointerCapture(e.pointerId);
  });

  drag.addEventListener('pointermove', e => {
    if (!moving) return;

    host.style.left =
      Math.max(0, Math.min(
        window.innerWidth - 80,
        initialLeft + e.clientX - startX
      )) + 'px';

    host.style.top =
      Math.max(0, Math.min(
        window.innerHeight - 50,
        initialTop + e.clientY - startY
      )) + 'px';
  });

  drag.addEventListener('pointerup', () => {
    moving = false;
  });

  drag.addEventListener('pointercancel', () => {
    moving = false;
  });

  // 기존 게시글 자동 불러오기
  title.value =
    document.getElementById('pt_title')?.value ?? '';

  content.value =
    document.getElementById('pt_content')?.value ?? '';

  notify('게시판 입력 도구 실행 완료');
})();
