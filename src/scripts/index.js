import "../pages/index.css";
import {
  getUserInfo,
  getCardList,
  setUserInfo,
  updateAvatar,
  addNewCard,
  deleteCardFromServer,
  changeLikeStatus,
} from "./components/api.js";
import {
  createCardElement,
  deleteCard,
  updateLikeStatus,
} from "./components/card.js";
import {
  openModalWindow,
  closeModalWindow,
  setCloseModalWindowEventListeners,
} from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";

// --- НАСТРОЙКИ ---

let currentUserId = "";

const validationConfig = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

// --- DOM УЗЛЫ ---

const placesWrap = document.querySelector(".places__list");
const logo = document.querySelector(".header__logo");

// Попап профиля
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(
  ".popup__input_type_description",
);

// Попап карточки
const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

// Попап аватара
const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

// Попап картинки
const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

// Попап статистики
const usersStatsModalWindow = document.querySelector(".popup_type_info");
const usersStatsModalTitle =
  usersStatsModalWindow.querySelector(".popup__title");
const usersStatsModalInfoList =
  usersStatsModalWindow.querySelector(".popup__info");
const usersStatsModalUsersTitle =
  usersStatsModalWindow.querySelector(".popup__text");
const usersStatsModalUserList =
  usersStatsModalWindow.querySelector(".popup__list");

// Кнопки открытия и элементы профиля
const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");
const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

// UX: Изменение текста кнопки при загрузке
function renderLoading(
  isLoading,
  formElement,
  buttonText = "Сохранить",
  loadingText = "Сохранение...",
) {
  const submitButton = formElement.querySelector(".popup__button");
  if (isLoading) {
    submitButton.textContent = loadingText;
  } else {
    submitButton.textContent = buttonText;
  }
}

// Форматирование даты
const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// Создание строки статистики (Шаблон)
const createInfoString = (label, value) => {
  const template = document.querySelector(
    "#popup-info-definition-template",
  ).content;
  const element = template.querySelector(".popup__info-item").cloneNode(true);
  element.querySelector(".popup__info-term").textContent = label;
  element.querySelector(".popup__info-description").textContent = value;
  return element;
};

// Создание никнейма пользователя (Шаблон)
const createUserPreview = (userName) => {
  const template = document.querySelector(
    "#popup-info-user-preview-template",
  ).content;
  const element = template.querySelector(".popup__list-item").cloneNode(true);
  element.textContent = userName;
  return element;
};

// --- ОБРАБОТЧИКИ ---

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  renderLoading(true, profileForm);
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => console.error(err))
    .finally(() => renderLoading(false, profileForm));
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  renderLoading(true, avatarForm);
  updateAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
      avatarForm.reset();
    })
    .catch((err) => console.error(err))
    .finally(() => renderLoading(false, avatarForm));
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  renderLoading(true, cardForm, "Создать", "Создание...");
  addNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((newCard) => {
      const cardElement = createCardElement(
        newCard,
        {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteCardClick,
        },
        currentUserId,
      );

      placesWrap.prepend(cardElement);
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch((err) => console.error(err))
    .finally(() => renderLoading(false, cardForm, "Создать", "Создание..."));
};

const handleLikeClick = (cardElement, cardId, userId) => {
  const likeButton = cardElement.querySelector(".card__like-button");
  const isLiked = likeButton.classList.contains("card__like-button_is-active");

  changeLikeStatus(cardId, isLiked)
    .then((updatedCardData) => {
      updateLikeStatus(cardElement, updatedCardData, userId);
    })
    .catch((err) => console.error(err));
};

const handleDeleteCardClick = (cardElement, cardId) => {
  deleteCardFromServer(cardId)
    .then(() => deleteCard(cardElement))
    .catch((err) => console.error(err));
};

const handleLogoClick = () => {
  // Очистка
  usersStatsModalInfoList.innerHTML = "";
  usersStatsModalUserList.innerHTML = "";

  usersStatsModalWindow.querySelector(".popup__title").textContent =
    "Статистика пользователей";
  usersStatsModalWindow.querySelector(".popup__text").textContent =
    "Все пользователи:";

  getCardList()
    .then((cards) => {
      if (cards && cards.length > 0) {
        // 1. Сбор данных для аналитики
        const totalCards = cards.length;
        const firstDate = new Date(cards[totalCards - 1].createdAt);
        const lastDate = new Date(cards[0].createdAt);

        // Считаем карточки по каждому пользователю
        const userStats = new Map(); // ID -> { name, count }
        cards.forEach((card) => {
          const userId = card.owner._id;
          if (!userStats.has(userId)) {
            userStats.set(userId, { name: card.owner.name, count: 0 });
          }
          userStats.get(userId).count += 1;
        });

        const totalUsers = userStats.size;
        const maxCardsPerUser = Math.max(
          ...Array.from(userStats.values()).map((u) => u.count),
        );

        // 2. Отрисовка текстовых строк
        usersStatsModalInfoList.append(
          createInfoString("Всего карточек:", totalCards),
        );
        usersStatsModalInfoList.append(
          createInfoString("Первая создана:", formatDate(firstDate)),
        );
        usersStatsModalInfoList.append(
          createInfoString("Последняя создана:", formatDate(lastDate)),
        );
        usersStatsModalInfoList.append(
          createInfoString("Всего пользователей:", totalUsers),
        );
        usersStatsModalInfoList.append(
          createInfoString("Максимум карточек от одного:", maxCardsPerUser),
        );

        // 3. Отрисовка имен пользователей
        userStats.forEach((data) => {
          usersStatsModalUserList.append(createUserPreview(data.name));
        });

        openModalWindow(usersStatsModalWindow);
      }
    })
    .catch((err) => console.error(err));
};

// --- СЛУШАТЕЛИ ---

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationConfig);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationConfig);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationConfig);
  openModalWindow(cardFormModalWindow);
});

logo.addEventListener("click", handleLogoClick);

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);

// Инициализация закрытия попапов (оверлей и крестик)
[
  profileFormModalWindow,
  cardFormModalWindow,
  avatarFormModalWindow,
  imageModalWindow,
  usersStatsModalWindow,
].forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

// --- ИНИЦИАЛИЗАЦИЯ ДАННЫХ ---

Promise.all([getUserInfo(), getCardList()])
  .then(([userData, cards]) => {
    currentUserId = userData._id;

    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((cardData) => {
      const cardElement = createCardElement(
        cardData,
        {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteCardClick,
        },
        currentUserId,
      );
      placesWrap.append(cardElement);
    });
  })
  .catch((err) => console.error(`Ошибка инициализации: ${err}`));

enableValidation(validationConfig);