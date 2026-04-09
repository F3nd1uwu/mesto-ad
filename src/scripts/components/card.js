// Функция лайка (пока оставляем локальной, далее добавим API)
export const likeCard = (likeButton) => {
  likeButton.classList.toggle("card__like-button_is-active");
};

// Функция удаления теперь просто удаляет элемент из DOM
export const deleteCard = (cardElement) => {
  cardElement.remove();
};

const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

// Функция только для визуального обновления лайка в DOM
export const updateLikeStatus = (cardElement, cardData, userId) => {
  const likeButton = cardElement.querySelector(".card__like-button");
  const likeCounter = cardElement.querySelector(".card__like-count");

  // Обновляем число лайков
  likeCounter.textContent = cardData.likes.length;

  // Проверяем, есть ли наш ID в массиве лайков
  const isLiked = cardData.likes.some((user) => user._id === userId);

  if (isLiked) {
    likeButton.classList.add("card__like-button_is-active");
  } else {
    likeButton.classList.remove("card__like-button_is-active");
  }
};

export const createCardElement = (
  data,
  { onPreviewPicture, onLikeIcon, onDeleteCard },
  userId,
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(
    ".card__control-button_type_delete",
  );
  const cardImage = cardElement.querySelector(".card__image");
  const cardTitle = cardElement.querySelector(".card__title");

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardTitle.textContent = data.name;

  // Инициализируем лайки (счетчик и состояние кнопки)
  updateLikeStatus(cardElement, data, userId);

  // Обработка удаления (скрытие корзины)
  if (data.owner._id !== userId) {
    deleteButton.remove();
  } else {
    deleteButton.addEventListener("click", () =>
      onDeleteCard(cardElement, data._id),
    );
  }

  // Лайк
  likeButton.addEventListener("click", () => {
    onLikeIcon(cardElement, data._id, userId);
  });

  // Превью
  cardImage.addEventListener("click", () =>
    onPreviewPicture({ name: data.name, link: data.link }),
  );

  return cardElement;
};
