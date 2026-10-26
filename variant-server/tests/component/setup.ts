import { configure } from '@testing-library/dom';

// За замовчуванням повідомлення про невдалий запит за роллю містить розмітку
// контейнера, а на таблиці з тисячею рядків це тисячі рядків виводу. Лишається
// перше речення (документація Testing Library, «Configuration Options», getElementError).
configure({
  getElementError: (message) => {
    const error = new Error((message ?? '').split('\n')[0]);
    error.name = 'TestingLibraryElementError';
    return error;
  },
});
