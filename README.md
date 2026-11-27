# JLPT Review

Thư viện webslide học Kanji và ôn ngữ pháp tiếng Nhật. [Mở website trên GitHub Pages](https://mjota666.github.io/JLPT-review/).

## Chạy trên máy

Chạy `python -m http.server 4173 --directory dist`, rồi mở [localhost:4173](http://localhost:4173/).

Dùng nút Tiếp, phím mũi tên, Page Up/Down hoặc vuốt ngang để chuyển từng ý. Phím Home về đầu bài, End đến cuối bài.

## Thêm bài học

1. Tạo một trang trong `dist/lessons/` theo mẫu của bài hiện có. Mỗi `section.slide` là một slide. Thêm `data-step` vào từng nhóm nội dung cần hiện sau một lần bấm.
2. Thêm liên kết và mô tả bài mới vào danh mục trong `dist/index.html`. Các trang dùng chung `dist/player.js` và `dist/styles.css`.
3. Đẩy thay đổi lên `main` để GitHub Actions cập nhật GitHub Pages.

Bài Thể bị động tham khảo [Riki Nihongo](https://riki.edu.vn/goc-chia-se/chia-the-bi-dong-tieng-nhat/).

## Thêm bài Kanji

1. Tạo một tệp JSON theo mẫu `dist/lessons/kanji-data/06a.json`, với 8 chữ theo thứ tự tài liệu. Mỗi từ có dạng `[loại, từ, hiragana, nghĩa]`. Loại âm là `on`, `kun` hoặc `special`, xét theo chữ đang học.
2. Điền `flashcards` bằng các từ đã dạy. Mỗi mục trong `sentences` gồm câu bằng hiragana, bản dịch tiếng Việt và danh sách cặp `[vai trò, cụm tiếng Nhật]`. Trình chiếu ghép các cụm thành câu và hiện nhãn sau bản dịch.
3. Thêm liên kết `./lessons/kanji.html?lesson=<mã-bài>` vào danh mục Kanji. Mã bài phải khớp tên tệp, bỏ đuôi `.json`. Xem thử mục lục, phần hiện đáp án và các câu trước khi đẩy lên `main`.

Bài 6A dùng thứ tự, từ và thẻ ôn từ phần đầu của bản trình chiếu Kanji bài 6 do người dùng cung cấp. Một số câu luyện đọc được rút gọn cho người mới học.
