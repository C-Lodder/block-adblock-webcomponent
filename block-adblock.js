/*
 * BlockAdBlock Web Component
 * Released under the MIT license
 */

class BlockAdBlock extends HTMLElement {
  constructor() {
    super();

    // Create a shadow root
    this.shadow = this.attachShadow({
      mode: 'open'
    });

    this.options = {
      checkOnLoad: true,
      resetOnEnd: true,
      loopCheckTime: 50,
      loopMaxNumber: 5,
      baitClass: 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links',
      baitStyle: 'width: 1px !important; height: 1px !important; position: absolute !important; left: -10000px !important; top: -1000px !important;',
      debug: false,
      message: 'We have detected that you are using an ad blocker',
    };

    this.storedVars = {
      bait: null,
      checking: false,
      loop: null,
      loopNumber: 0,
      event: {
        detected: [],
        notDetected: [],
      },
    };
  }

  connectedCallback() {
    const self = this;
    const eventCallback = () => {
      setTimeout(() => {
        if (self.options.checkOnLoad) {
          if (self.options.debug) {
            self.log('onload->eventCallback', 'A check loading is launched');
          }
          if (self.storedVars.bait === null) {
            self.creatBait();
          }
          setTimeout(() => {
            self.check();
          }, 1);
        }
      }, 1);
    };

    window.addEventListener('load', eventCallback, false);

    // Attach the created elements to the shadow dom
    this.shadow.appendChild(this.buildStyle());
  }

  buildStyle() {
    const style = document.createElement('style');

    style.textContent = `
      :host {
        font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";
        display: none;
        position: sticky;
        top: 0;
        padding: 10px;
        min-height: 20px;
        background: #da4f49;
      }
      :host(.show) {
        display: block;
      }
      span {
        display: block;
        font-size: 16px;
        font-weight: 400;
        line-height: 1.2;
        color: #fff;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      };
      `;

    return style;
  }

  log(method, message) {
    console.log(`[BlockAdBlock][${method}] ${message}`);
  }

  setOption(options, value) {
    if (value !== undefined) {
      const key = options;
      options = {};
      options[key] = value;
    }

    for (const option in options) {
      this.options[option] = options[option];
      if (this.options.debug) {
        this.log('setOption', `The option "${option}" he was assigned to "${options[option]}"`);
      }
    }
    return this;
  }

  creatBait() {
    const bait = document.createElement('div');
    bait.setAttribute('class', this.options.baitClass);
    bait.setAttribute('style', this.options.baitStyle);
    this.storedVars.bait = window.document.body.appendChild(bait);

    this.storedVars.bait.offsetParent;
    this.storedVars.bait.offsetHeight;
    this.storedVars.bait.offsetLeft;
    this.storedVars.bait.offsetTop;
    this.storedVars.bait.offsetWidth;
    this.storedVars.bait.clientHeight;
    this.storedVars.bait.clientWidth;

    if (this.options.debug) {
      this.log('creatBait', 'Bait has been created');
    }
  }

  destroyBait() {
    window.document.body.removeChild(this.storedVars.bait);
    this.storedVars.bait = null;

    if (this.options.debug) {
      this.log('destroyBait', 'Bait has been removed');
    }
  }

  check(loop) {
    if (loop === undefined) {
      loop = true;
    }

    if (this.options.debug) {
      this.log('check', `An audit was requested ${loop ? 'with a' : 'without'} loop`);
    }

    if (this.storedVars.checking) {
      if (this.options.debug) {
        this.log('check', 'A check was canceled because there is already an ongoing');
      }
      return false;
    }

    this.storedVars.checking = true;

    if (this.storedVars.bait === null) {
      this.creatBait();
    }

    const self = this;
    this.storedVars.loopNumber = 0;
    if (loop) {
      this.storedVars.loop = setInterval(() => {
        self.checkBait(loop);
      }, this.options.loopCheckTime);
    }

    setTimeout(() => {
      self.checkBait(loop);
    }, 1);

    if (this.options.debug) {
      this.log('check', 'A check is in progress...');
    }

    return true;
  }

  checkBait(loop) {
    let detected = false;

    if (this.storedVars.bait === null) {
      this.creatBait();
    }

    if (window.document.body.getAttribute('abp') !== null ||
      this.storedVars.bait.offsetParent === null ||
      this.storedVars.bait.offsetHeight == 0 ||
      this.storedVars.bait.offsetLeft == 0 ||
      this.storedVars.bait.offsetTop == 0 ||
      this.storedVars.bait.offsetWidth == 0 ||
      this.storedVars.bait.clientHeight == 0 ||
      this.storedVars.bait.clientWidth == 0) {
      detected = true;
    }

    if (window.getComputedStyle !== undefined) {
      const baitTemp = window.getComputedStyle(this.storedVars.bait, null);
      if (baitTemp.getPropertyValue('display') == 'none' ||
        baitTemp.getPropertyValue('visibility') == 'hidden') {
        detected = true;
      }
    }

    if (this.options.debug) {
      this.log('checkBait', `A check (${this.storedVars.loopNumber + 1}/${this.options.loopMaxNumber} ~${1 + this.storedVars.loopNumber * this.options.loopCheckTime}ms) was conducted and detection is ${detected ? 'positive' : 'negative'}`);
    }

    if (loop) {
      this.storedVars.loopNumber++;

      if (this.storedVars.loopNumber >= this.options.loopMaxNumber) {
        this.stopLoop();
      }
    }

    if (detected) {
      this.stopLoop();
      this.destroyBait();
      this.emitEvent(true);

      if (loop) {
        this.storedVars.checking = false;
      }
    } else if (this.storedVars.loop === null || !loop) {
      this.destroyBait();
      this.emitEvent(false);

      if (loop) {
        this.storedVars.checking = false;
      }
    }
  }

  stopLoop(detected) {
    clearInterval(this.storedVars.loop);
    this.storedVars.loop = null;
    this.storedVars.loopNumber = 0;

    if (this.options.debug) {
      this.log('stopLoop', 'A loop has been stopped');
    }
  }

  emitEvent(detected) {
    if (this.options.debug) {
      this.log('emitEvent', `An event with a ${detected ? 'positive' : 'negative'} detection was called`);
    }

    if (detected) {
      const span = document.createElement('span');
      span.innerText = this.options.message;
	  this.shadow.appendChild(span);
	  this.classList.add('show');
    }

    const fns = this.storedVars.event[(detected ? 'detected' : 'notDetected')];
    for (const i in fns) {
      if (this.options.debug) {
        this.log('emitEvent', `Call function ${parseInt(i)+1} / ${fns.length}`);
      }

      if (fns.hasOwnProperty(i)) {
        fns[i]();
      }
    }

    if (this.options.resetOnEnd) {
      this.clearEvent();
    }

    return this;
  }

  clearEvent() {
    this.storedVars.event.detected = [];
    this.storedVars.event.notDetected = [];

    if (this.options.debug) {
      this.log('clearEvent', 'The event list has been cleared');
    }
  }

  on(detected, fn) {
    this.storedVars.event[(detected ? 'detected' : 'notDetected')].push(fn);
    if (this.options.debug) {
      this.log('on', `A type of event "${detected ? 'detected' : 'notDetected'}" was added`);
    }

    return this;
  }
}

customElements.define('block-adblock', BlockAdBlock);
