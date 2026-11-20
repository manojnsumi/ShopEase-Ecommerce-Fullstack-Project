-- ============================================================
--  E-Commerce Shop - MySQL Database Schema
--  Import with:  mysql -u root -p < schema.sql
--  (or open phpMyAdmin / MySQL Workbench and run this file)
-- ============================================================

DROP DATABASE IF EXISTS ecommerce_db;
CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce_db;

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,                -- bcrypt hash
  phone       VARCHAR(20)   DEFAULT NULL,
  role        ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  is_blocked  TINYINT(1)    NOT NULL DEFAULT 0,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE categories (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL UNIQUE,
  slug       VARCHAR(120)  NOT NULL UNIQUE,
  icon       VARCHAR(60)   NOT NULL DEFAULT 'fa-tag',  -- Font Awesome class (CDN icon)
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
CREATE TABLE products (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(200)  NOT NULL,
  slug           VARCHAR(220)  NOT NULL UNIQUE,
  description    TEXT          NOT NULL,
  price          DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2) DEFAULT NULL,
  category_id    INT           NOT NULL,
  image_url      VARCHAR(500)  NOT NULL,             -- external image link (Unsplash CDN)
  stock          INT           NOT NULL DEFAULT 0,
  rating         DECIMAL(3,2)  NOT NULL DEFAULT 0,
  is_active      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CART ITEMS (one cart row per user+product)
-- ------------------------------------------------------------
CREATE TABLE cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_user_product (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- WISHLIST
-- ------------------------------------------------------------
CREATE TABLE wishlist (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wish (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- ORDERS + ORDER ITEMS
-- ------------------------------------------------------------
CREATE TABLE orders (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  total_amount  DECIMAL(10,2) NOT NULL,
  status        ENUM('pending','paid','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  payment_method ENUM('cod','card') NOT NULL DEFAULT 'cod',
  address       VARCHAR(255) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  postal_code   VARCHAR(20)  NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT NOT NULL,
  product_id   INT NOT NULL,
  product_name VARCHAR(200) NOT NULL,          -- snapshot at purchase time
  image_url    VARCHAR(500) DEFAULT NULL,
  unit_price   DECIMAL(10,2) NOT NULL,
  quantity     INT NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------
CREATE TABLE reviews (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id    INT NOT NULL,
  rating     TINYINT NOT NULL,                 -- 1..5
  comment    TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review (product_id, user_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- COUPONS
-- ------------------------------------------------------------
CREATE TABLE coupons (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  code             VARCHAR(50) NOT NULL UNIQUE,
  discount_percent INT NOT NULL,               -- 1..100
  is_active        TINYINT(1)  NOT NULL DEFAULT 1,
  expires_at       DATETIME    DEFAULT NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
CREATE TABLE notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- SUPPORT TICKETS + MESSAGES
-- ------------------------------------------------------------
CREATE TABLE support_tickets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  subject    VARCHAR(200) NOT NULL,
  status     ENUM('open','answered','closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE support_messages (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  sender    ENUM('user','admin') NOT NULL,
  message   TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PAYMENTS
-- ------------------------------------------------------------
CREATE TABLE payments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_id        INT NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  method          VARCHAR(50) NOT NULL,        -- cod | card
  status          ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending',
  transaction_ref VARCHAR(100) DEFAULT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  SEED DATA
-- ============================================================

-- Passwords (bcrypt, cost 10):
--   admin@shop.com  -> Admin@123
--   john@email.com  -> User@123
INSERT INTO users (name, email, password, phone, role) VALUES
('Shop Admin', 'admin@shop.com',  '$2b$10$If8461JgEQXHdLGWImBQ6OCxKuVsPV5BGIOvB96N7zlNwkFJyRrXW', '9999999999', 'admin'),
('John Doe',   'john@email.com',  '$2b$10$WH/hunsEgIy65aKlUVfUCeB4oi42hnZgf5BofTy91JotDD6wzTJYK', '8888888888', 'customer');

INSERT INTO categories (name, slug, icon) VALUES
('Electronics', 'electronics', 'fa-mobile-screen'),
('Fashion',     'fashion',     'fa-shirt'),
('Home & Kitchen', 'home-kitchen', 'fa-house'),
('Beauty',      'beauty',      'fa-spa'),
('Sports',      'sports',      'fa-basketball');

-- Product images are external CDN links (Unsplash) - no local assets needed.
INSERT INTO products (name, slug, description, price, discount_price, category_id, image_url, stock) VALUES
('Wireless Headphones', 'wireless-headphones',
 'Over-ear wireless headphones with deep bass, soft cushions and 30 hours of battery life.',
 99.99, 79.99, 1, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', 25),
('Smart Watch', 'smart-watch',
 'Fitness smart watch with heart-rate monitor, step counter and bright AMOLED display.',
 149.99, NULL, 1, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80', 18),
('Digital Camera', 'digital-camera',
 'Compact digital camera with 24 MP sensor, 4K video and built-in Wi-Fi sharing.',
 399.00, 349.00, 1, 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80', 8),
('Laptop Pro 14', 'laptop-pro-14',
 'Thin and light 14-inch laptop with fast SSD, full-day battery and aluminium body.',
 999.00, NULL, 1, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80', 10),
('Smartphone X', 'smartphone-x',
 'Flagship smartphone with 6.5-inch OLED screen, triple camera and all-day battery.',
 699.00, 649.00, 1, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', 30),
('Mechanical Keyboard', 'mechanical-keyboard',
 'RGB backlit mechanical keyboard with blue switches and aluminium frame.',
 89.99, NULL, 1, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80', 22),
('Bluetooth Speaker', 'bluetooth-speaker',
 'Portable waterproof Bluetooth speaker with 360-degree sound and 12-hour playtime.',
 59.99, 44.99, 1, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80', 35),
('Classic Sunglasses', 'classic-sunglasses',
 'UV-protected polarized sunglasses with a lightweight classic frame.',
 49.99, NULL, 2, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80', 40),
('Urban Backpack', 'urban-backpack',
 'Water-resistant 20 L backpack with laptop sleeve and USB charging port.',
 69.99, 54.99, 2, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', 27),
('Basic Cotton T-Shirt', 'basic-cotton-t-shirt',
 '100% organic cotton t-shirt, breathable and available in classic fits.',
 19.99, NULL, 2, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80', 100),
('Ceramic Coffee Mug Set', 'ceramic-coffee-mug-set',
 'Set of 4 hand-glazed ceramic mugs - perfect for coffee, tea and cocoa.',
 29.99, 24.99, 3, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80', 50),
('Running Shoes', 'running-shoes',
 'Lightweight running shoes with cushioned sole and breathable mesh upper.',
 119.99, 99.99, 5, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', 20);

INSERT INTO coupons (code, discount_percent, is_active, expires_at) VALUES
('SAVE10', 10, 1, '2027-12-31 23:59:59'),
('WELCOME5', 5, 1, NULL);

INSERT INTO notifications (user_id, title, message) VALUES
(2, 'Welcome to ShopEase!', 'Use coupon WELCOME5 for 5% off on your first order.'),
(2, 'New arrivals', 'Wireless Headphones are now on sale at $79.99.');

-- Done. Default logins:
--   Admin   : admin@shop.com / Admin@123
--   Customer: john@email.com / User@123
