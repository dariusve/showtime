import { escapeHtml } from "./markdown.js";
import { getImageFit, getSlideLabel, renderSlideContent } from "./slides.js";
import { formatCssUrl } from "./transitions.js";

export function renderThumbnails({ deck, current, thumbnailsEl }) {
  thumbnailsEl.innerHTML = deck
    .map((slide, index) => {
      const label = getSlideLabel(slide, index);
      const style = slide.meta.background
        ? ` style="--slide-background-image: ${formatCssUrl(slide.meta.background)}"`
        : "";
      const background = slide.meta.background ? " data-background" : "";
      return `
        <button class="thumbnail" type="button" data-index="${index}" aria-label="Go to slide ${index + 1}: ${escapeHtml(label)}">
          <span class="thumbnail-preview" aria-hidden="true">
            <span
              class="thumbnail-slide slide"
              data-layout="${escapeHtml(String(slide.meta.layout || "default"))}"
              data-fit="${escapeHtml(getImageFit(slide.meta.fit))}"
              ${background}${style}
            >
              ${renderSlideContent(slide)}
            </span>
          </span>
          <span class="thumbnail-label">${index + 1}</span>
        </button>
      `;
    })
    .join("");

  updateThumbnails({ current, thumbnailsEl });
}

export function updateThumbnails({ current, thumbnailsEl, thumbnailTrayEl, thumbnailsScrollLeftButton, thumbnailsScrollRightButton }) {
  for (const thumbnail of thumbnailsEl.querySelectorAll(".thumbnail")) {
    const isCurrent = Number(thumbnail.dataset.index) === current;
    thumbnail.classList.toggle("is-current", isCurrent);
    thumbnail.toggleAttribute("aria-current", isCurrent);
  }

  const activeThumbnail = thumbnailsEl.querySelector(".thumbnail.is-current");
  activeThumbnail?.scrollIntoView({ block: "nearest", inline: "center" });

  if (thumbnailTrayEl && thumbnailsScrollLeftButton && thumbnailsScrollRightButton) {
    updateThumbnailScrollButtons({ thumbnailsEl, thumbnailTrayEl, thumbnailsScrollLeftButton, thumbnailsScrollRightButton });
  }
}

export function scrollThumbnails(thumbnailsEl, direction) {
  const distance = Math.max(thumbnailsEl.clientWidth * 0.72, 180);
  thumbnailsEl.scrollBy({ left: direction * distance, behavior: "smooth" });
}

export function updateThumbnailScrollButtons({ thumbnailsEl, thumbnailTrayEl, thumbnailsScrollLeftButton, thumbnailsScrollRightButton }) {
  const maxScroll = Math.max(0, thumbnailsEl.scrollWidth - thumbnailsEl.clientWidth);
  const canScroll = thumbnailTrayEl.classList.contains("is-visible") && maxScroll > 1;
  thumbnailsScrollLeftButton.disabled = !canScroll || thumbnailsEl.scrollLeft <= 1;
  thumbnailsScrollRightButton.disabled = !canScroll || thumbnailsEl.scrollLeft >= maxScroll - 1;
}
