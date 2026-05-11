/*
 * Minimal Bootstrap bundle for this project.
 * Includes only: Carousel (data API) and Modal (+ jQuery .modal interface).
 */
(function (global) {
  "use strict";

  var carouselInstances = new WeakMap();
  var modalInstances = new WeakMap();

  function getTargetFromTrigger(trigger) {
    var selector = trigger.getAttribute("data-bs-target") || trigger.getAttribute("href");
    if (!selector) {
      return null;
    }
    if (selector.indexOf("#") > -1 && selector.charAt(0) !== "#") {
      selector = "#" + selector.split("#")[1];
    }
    try {
      return document.querySelector(selector);
    } catch (error) {
      return null;
    }
  }

  function setActiveIndicator(carouselElement, newIndex) {
    var indicators = carouselElement.querySelectorAll(".carousel-indicators [data-bs-slide-to]");
    for (var i = 0; i < indicators.length; i += 1) {
      var indicator = indicators[i];
      var index = Number(indicator.getAttribute("data-bs-slide-to"));
      var isActive = index === newIndex;
      indicator.classList.toggle("active", isActive);
      if (isActive) {
        indicator.setAttribute("aria-current", "true");
      } else {
        indicator.removeAttribute("aria-current");
      }
    }
  }

  function Carousel(element, options) {
    this._element = element;
    this._items = Array.prototype.slice.call(element.querySelectorAll(".carousel-item"));
    this._intervalId = null;
    this._isSliding = false;
    this._config = {
      interval: 5000,
      ride: false
    };

    if (options && typeof options.interval === "number") {
      this._config.interval = options.interval;
    }
    if (options && options.ride) {
      this._config.ride = true;
    }

    if (element.getAttribute("data-bs-ride") === "carousel") {
      this._config.ride = true;
    }

    if (!this._items.some(function (item) { return item.classList.contains("active"); })) {
      if (this._items[0]) {
        this._items[0].classList.add("active");
      }
    }

    if (this._config.ride) {
      this.cycle();
    }
  }

  Carousel.prototype._getActiveIndex = function () {
    for (var i = 0; i < this._items.length; i += 1) {
      if (this._items[i].classList.contains("active")) {
        return i;
      }
    }
    return 0;
  };

  Carousel.prototype._slideTo = function (nextIndex, direction) {
    if (!this._items.length) {
      return;
    }
    if (this._isSliding) {
      return;
    }

    var currentIndex = this._getActiveIndex();
    if (nextIndex < 0 || nextIndex >= this._items.length || nextIndex === currentIndex) {
      return;
    }

    this._isSliding = true;
    var currentItem = this._items[currentIndex];
    var nextItem = this._items[nextIndex];
    var orderClass = direction === "next" ? "carousel-item-next" : "carousel-item-prev";
    var directionalClass = direction === "next" ? "carousel-item-start" : "carousel-item-end";

    nextItem.classList.add(orderClass);
    nextItem.offsetWidth;
    currentItem.classList.add(directionalClass);
    nextItem.classList.add(directionalClass);

    var self = this;
    var cleanupDone = false;
    var cleanup = function () {
      if (cleanupDone) {
        return;
      }
      cleanupDone = true;
      nextItem.classList.remove(orderClass, directionalClass);
      nextItem.classList.add("active");
      currentItem.classList.remove("active", directionalClass);
      self._isSliding = false;
      setActiveIndicator(self._element, nextIndex);
    };

    nextItem.addEventListener("transitionend", cleanup, { once: true });
    setTimeout(cleanup, 700);
  };

  Carousel.prototype.next = function () {
    if (!this._items.length) {
      return;
    }
    var nextIndex = (this._getActiveIndex() + 1) % this._items.length;
    this._slideTo(nextIndex, "next");
  };

  Carousel.prototype.prev = function () {
    if (!this._items.length) {
      return;
    }
    var prevIndex = (this._getActiveIndex() - 1 + this._items.length) % this._items.length;
    this._slideTo(prevIndex, "prev");
  };

  Carousel.prototype.to = function (index) {
    var activeIndex = this._getActiveIndex();
    var direction = index > activeIndex ? "next" : "prev";
    this._slideTo(index, direction);
  };

  Carousel.prototype.pause = function () {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  };

  Carousel.prototype.cycle = function () {
    var self = this;
    this.pause();
    this._intervalId = setInterval(function () {
      self.next();
    }, this._config.interval);
  };

  Carousel.getOrCreateInstance = function (element) {
    if (!carouselInstances.has(element)) {
      carouselInstances.set(element, new Carousel(element));
    }
    return carouselInstances.get(element);
  };

  function Modal(element) {
    this._element = element;
    this._backdrop = null;
  }

  Modal.prototype._createBackdrop = function () {
    if (this._backdrop) {
      return;
    }
    var backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop fade show";
    backdrop.addEventListener("click", this.hide.bind(this));
    this._backdrop = backdrop;
    document.body.appendChild(backdrop);
  };

  Modal.prototype._removeBackdrop = function () {
    if (this._backdrop && this._backdrop.parentNode) {
      this._backdrop.parentNode.removeChild(this._backdrop);
    }
    this._backdrop = null;
  };

  Modal.prototype.show = function () {
    this._createBackdrop();
    this._element.style.display = "block";
    this._element.removeAttribute("aria-hidden");
    this._element.setAttribute("aria-modal", "true");
    this._element.classList.add("show");
    document.body.classList.add("modal-open");
  };

  Modal.prototype.hide = function () {
    this._element.classList.remove("show");
    this._element.style.display = "none";
    this._element.setAttribute("aria-hidden", "true");
    this._element.removeAttribute("aria-modal");
    document.body.classList.remove("modal-open");
    this._removeBackdrop();
  };

  Modal.prototype.toggle = function () {
    if (this._element.classList.contains("show")) {
      this.hide();
    } else {
      this.show();
    }
  };

  Modal.getOrCreateInstance = function (element) {
    if (!modalInstances.has(element)) {
      modalInstances.set(element, new Modal(element));
    }
    return modalInstances.get(element);
  };

  function handleDocumentClick(event) {
    var trigger = event.target.closest("[data-bs-slide], [data-bs-slide-to], [data-bs-dismiss], [data-bs-toggle='modal']");
    if (!trigger) {
      return;
    }

    var target = getTargetFromTrigger(trigger);

    if (trigger.hasAttribute("data-bs-slide") && target && target.classList.contains("carousel")) {
      event.preventDefault();
      var carousel = Carousel.getOrCreateInstance(target);
      if (trigger.getAttribute("data-bs-slide") === "next") {
        carousel.next();
      } else {
        carousel.prev();
      }
      return;
    }

    if (trigger.hasAttribute("data-bs-slide-to") && target && target.classList.contains("carousel")) {
      event.preventDefault();
      var index = Number(trigger.getAttribute("data-bs-slide-to"));
      Carousel.getOrCreateInstance(target).to(index);
      return;
    }

    if (trigger.getAttribute("data-bs-dismiss") === "modal") {
      var modalElement = trigger.closest(".modal");
      if (modalElement) {
        event.preventDefault();
        Modal.getOrCreateInstance(modalElement).hide();
      }
      return;
    }

    if (trigger.getAttribute("data-bs-toggle") === "modal" && target && target.classList.contains("modal")) {
      event.preventDefault();
      Modal.getOrCreateInstance(target).toggle();
    }
  }

  function initCarouselDataApi() {
    var carousels = document.querySelectorAll(".carousel[data-bs-ride='carousel']");
    for (var i = 0; i < carousels.length; i += 1) {
      Carousel.getOrCreateInstance(carousels[i]).cycle();
    }
  }

  function registerJqueryBridge() {
    var $ = global.jQuery;
    if (!$ || !$.fn) {
      return;
    }
    if (!$.fn.modal) {
      $.fn.modal = function (action) {
        return this.each(function () {
          var instance = Modal.getOrCreateInstance(this);
          if (action === "show") {
            instance.show();
          } else if (action === "hide") {
            instance.hide();
          } else {
            instance.toggle();
          }
        });
      };
    }
  }

  function onReady() {
    document.addEventListener("click", handleDocumentClick);
    initCarouselDataApi();
    registerJqueryBridge();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }

  global.addEventListener("load", registerJqueryBridge);

  global.bootstrap = {
    Carousel: Carousel,
    Modal: Modal
  };
})(window);