# JLPT Review

Thư viện webslide ôn ngữ pháp tiếng Nhật. [Mở website trên GitHub Pages](https://mjota666.github.io/JLPT-review/).

## Chạy trên máy

Chạy `python -m http.server 4173 --directory dist`, rồi mở [localhost:4173](http://localhost:4173/).

Dùng nút Tiếp, phím mũi tên, Page Up/Down hoặc vuốt ngang để chuyển từng ý. Phím Home về đầu bài, End đến cuối bài.

## Thêm bài học

1. Tạo một trang trong `dist/lessons/` theo mẫu của bài hiện có. Mỗi `section.slide` là một slide. Thêm `data-step` vào từng nhóm nội dung cần hiện sau một lần bấm.
2. Thêm liên kết và mô tả bài mới vào danh mục trong `dist/index.html`. Các trang dùng chung `dist/player.js` và `dist/styles.css`.
3. Đẩy thay đổi lên `main` để GitHub Actions cập nhật GitHub Pages.

Bài Thể bị động tham khảo [Riki Nihongo](https://riki.edu.vn/goc-chia-se/chia-the-bi-dong-tieng-nhat/).
