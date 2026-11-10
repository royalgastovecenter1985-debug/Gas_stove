-- =====================================================================
-- Royal Gas Stove Center — database schema + sample data
-- MySQL 5.7+ / MariaDB 10.3+   (utf8mb4)
-- Import:  mysql -u root -p < database/schema.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `royalgasstove` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `royalgasstove`;
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS products, categories, inquiries, certificates, testimonials, reels, admin_users, settings, login_attempts;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  slug          VARCHAR(140) NOT NULL UNIQUE,
  tagline       VARCHAR(255) DEFAULT NULL,
  description   TEXT,
  image         VARCHAR(255) DEFAULT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id       INT UNSIGNED NOT NULL,
  name              VARCHAR(180) NOT NULL,
  slug              VARCHAR(200) NOT NULL UNIQUE,
  short_description VARCHAR(300) DEFAULT NULL,
  description       TEXT,
  specs             JSON NULL,
  images            JSON NULL,
  is_featured       TINYINT(1) NOT NULL DEFAULT 0,
  is_active         TINYINT(1) NOT NULL DEFAULT 1,
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_cat (category_id),
  KEY idx_featured (is_featured),
  FULLTEXT KEY ft_search (name, short_description),
  CONSTRAINT fk_prod_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inquiries (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  phone       VARCHAR(30)  NOT NULL,
  email       VARCHAR(160) DEFAULT NULL,
  city        VARCHAR(100) DEFAULT NULL,
  product     VARCHAR(200) DEFAULT NULL,
  message     TEXT,
  source      VARCHAR(40) DEFAULT 'website',
  ip_address  VARCHAR(45) DEFAULT NULL,
  user_agent  VARCHAR(255) DEFAULT NULL,
  status      ENUM('new','contacted','quoted','closed') NOT NULL DEFAULT 'new',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_status (status),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE certificates (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(160) NOT NULL,
  issued_by   VARCHAR(160) DEFAULT NULL,
  year        VARCHAR(10)  DEFAULT NULL,
  image       VARCHAR(255) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE testimonials (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  designation VARCHAR(160) DEFAULT NULL,
  message     TEXT NOT NULL,
  product     VARCHAR(180) DEFAULT NULL,
  rating      TINYINT UNSIGNED NOT NULL DEFAULT 5,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reels (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(160) NOT NULL,
  link        VARCHAR(255) DEFAULT NULL,
  poster      VARCHAR(255) NOT NULL,
  video       VARCHAR(255) DEFAULT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(60) NOT NULL UNIQUE,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  last_login_at DATETIME DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE login_attempts (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ip_address  VARCHAR(45) NOT NULL,
  attempted_at DATETIME NOT NULL,
  KEY idx_ip_time (ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE settings (
  `key`   VARCHAR(80) PRIMARY KEY,
  `value` TEXT,
  `label` VARCHAR(160) DEFAULT NULL,
  `group` VARCHAR(40) DEFAULT 'general'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- DATA
-- =====================================================================

-- Default admin:  username = admin   password = Admin@123   (CHANGE IT after first login)
INSERT INTO admin_users (username, name, email, password_hash) VALUES
('admin', 'Site Administrator', NULL, '$2y$10$JBU7o1aexe7yjvTnBXdCLu9IUY0WPaqB1fqtUeL6ie8ZQUGeRehOS');

INSERT INTO settings (`key`, `value`, `label`, `group`) VALUES
('site_name',          'Royal Gas Stove Center', 'Business name', 'general'),
('tagline',            'Commercial kitchen equipment — wholesale, supply, distribution and service', 'Tagline', 'general'),
('address',            'Nr. Shekha Munjals Pole, Opp. Bhoiwada''s Pole, Kalupur Tower Road, Ahmedabad, Gujarat 380001, India', 'Address', 'contact'),
('phone_1',            '+91-9099779945', 'Phone 1', 'contact'),
('phone_2',            '+91-9998327943', 'Phone 2', 'contact'),
('phone_3',            '', 'Phone 3', 'contact'),
('whatsapp',           '919998327943',   'WhatsApp number (digits only, with country code)', 'contact'),
('email',              'royalgas1221@gmail.com', 'Public email (leave empty to hide)', 'contact'),
('business_hours',     'Mon – Sat: 9:30 AM – 8:30 PM', 'Business hours', 'contact'),
('map_lat',            '23.029016', 'Map latitude', 'contact'),
('map_lng',            '72.592350', 'Map longitude', 'contact'),
('instagram_url',      'https://www.instagram.com/royal_gas_stove_center/', 'Instagram URL', 'social'),
('instagram_handle',   'royal_gas_stove_center', 'Instagram handle (without @)', 'social'),
('facebook_url',       'https://www.facebook.com/share/16Hvx83j11/', 'Facebook URL', 'social'),
('google_url',         'https://www.google.com/maps/search/?api=1&query=Royal+Gas+Stove+Center+Kalupur+Tower+Road+Ahmedabad', 'Google Business / reviews URL', 'social'),
('google_rating',      '3.9', 'Google rating shown in testimonials, e.g. 4.8 (leave empty to hide)', 'social'),
('google_review_count','12', 'Number of Google reviews, e.g. 120 (leave empty to hide)', 'social'),
('brochure_file',      'assets/pdf/Booklate-1.pdf', 'Brochure PDF path', 'general'),
('stat_years',         '', 'Years in business (leave empty to hide)', 'stats'),
('stat_clients',       '', 'Kitchens supplied / clients (leave empty to hide)', 'stats'),
('client_list',        'Restaurants|Hotels|Caterers|Sweet & farsan shops|Cloud kitchens|Canteens|Dhabas|Food trucks|Banquet halls|Hostels & mess', 'Who we serve (separate with |)', 'general'),
('notify_email',       '', 'Send inquiry notifications to (email)', 'general');

-- Generated catalogue (real products & photos from royalgasstovecenter.shop)
INSERT INTO categories (id, name, slug, tagline, description, image, sort_order) VALUES
(1, 'Cooking Range', 'cooking-range', 'SS burner ranges for restaurant hot lines', 'Stainless-steel cooking ranges with one, two, three or four high-pressure burners on a single rigid frame. Pot rests, back splash and under shelf options make them the backbone of a restaurant or hotel hot line. Every range is built to your kitchen''s length, height and burner layout.', 'assets/img/products/three-burner-range-24x72x30-1.jpg', 1),
(2, 'Single Dom Burner', 'single-dom-burner', 'Cast-iron dom stoves for heavy vessels', 'Single dom stoves with heavy cast-iron burners for bulk cooking — from the compact Bobby stove to Super and Jumbo models for large handis and kadhais. A low, stable frame keeps big vessels safe through long cooking hours.', 'assets/img/products/dom-jumbo-stove-24x24x12-1.jpg', 2),
(3, 'Double Dom Burner', 'double-dom-burner', 'Two and three burner dom stoves on one frame', 'Double and three-burner dom stoves let you run several large vessels side by side on one sturdy frame. Ideal for caterers, canteens and restaurants where space is tight but output has to stay high.', 'assets/img/products/super-double-burner-15x42x8-1.jpg', 3),
(4, 'Puffer Bhatti', 'puffer-bhatti', 'Forced-flame bhattis for frying and sweets', 'Puffer and bullet-puffer bhattis deliver intense, even heat for deep frying, farsan, sweets and bulk boiling. Insulated bodies keep the heat on the vessel and the gas bill down. Ceramic and bullet burner options are available.', 'assets/img/products/bullet-puffer-bhatti-15x36x12-1.jpg', 4),
(5, 'Dhosa Bhatti', 'dhosa-bhatti', 'Long-flame bhattis for even dosa plates', 'Dhosa bhattis built around an evenly heated plate, so every dosa comes out crisp from edge to edge. Available in gas and electric models and in sizes for small outlets through to busy hotel kitchens.', 'assets/img/products/dhosa-bhatti-24x36x12-1.jpg', 5),
(6, 'Round & Rumali Stove', 'round-rumali-stove', 'Round body stoves, rumali and ring jumbo stoves', 'Round-body stoves for tandoori-style cooking, rumali roti and high-heat jumbo ring burners. Heavy bodies and cast burners built for continuous use in dhabas, caterers and restaurant kitchens.', 'assets/img/products/round-stove-10x10x10-1.jpg', 6),
(7, 'Ring Burner', 'ring-burner', 'Replacement and multi-ring burners', 'Cast-iron ring burners and 3-in-1 multi-ring burners for bhattis and dom stoves — available as replacements or for new fabrication.', 'assets/img/products/ring-burner-1.jpg', 7),
(8, 'Transport Trolley', 'transport-trolley', 'Service, dumping and utility trolleys', 'Stainless-steel trolleys for moving food, utensils and waste around the kitchen — service trolleys, dumping trolleys and simple utility trolleys with smooth castors.', 'assets/img/products/service-trolley-1.jpg', 8),
(9, 'Table', 'table', 'SS work tables, folding tables and racks', 'Stainless-steel work tables, shelf tables, pick-up tables, folding tables and storage racks. Strong, hygienic and made to your measurements.', 'assets/img/products/three-shelf-table-24x46x36-1.jpg', 9),
(10, 'Sink', 'sink', 'Single and double bowl commercial sinks', 'Commercial sinks in stainless steel with deep bowls that take large pots and trays. Single and double-bowl models with drain boards and under shelves.', 'assets/img/products/double-sink-24x72x30-1.jpg', 10),
(11, 'Griller', 'griller', 'Electric grillers and gas & charcoal barbeques', 'Electric sandwich grillers for cafés and fast-food counters, plus gas and charcoal barbeques for kebab and tikka stations.', 'assets/img/products/electric-sandwich-griller-12x12-1.jpg', 11),
(12, 'Oven', 'oven', 'Pizza ovens and dhokla–idli steamers', 'Gas and electric pizza ovens, and gas dhokla–idli ovens for farsan shops, cafés and caterers.', 'assets/img/products/gas-pizza-oven-1.jpg', 12),
(13, 'Ben Marie', 'ben-marie', 'Keep curries hot and ready to serve', 'Ben Marie counters with GN pans or round pots (pavali) that keep curries, dal and rice at serving temperature. Single and double-body models, with overhead shelves on request.', 'assets/img/products/8-pavali-ben-marie-with-overhead-shelf-1.jpg', 13),
(14, 'Shawarma Machine', 'shawarma-machine', 'Vertical gas broilers for shawarma', 'Vertical shawarma machines with gas burners that roast evenly on all sides — standalone or built into a stainless-steel counter.', 'assets/img/products/shawarma-machine-with-counter-1.jpg', 14),
(15, 'Dhosa Tava', 'dhosa-tava', 'Electric and gas tavas', 'Heavy tavas for dosa, uttapam and tawa fry — including electric tavas for counters without a gas line.', 'assets/img/products/electric-tawa-15x15-1.jpg', 15),
(16, 'Counters & Food Truck', 'counters-food-truck', 'Live counters and food truck stoves', 'Custom live-cooking counters — Rajwadi counters, paneer tikka counters — and compact stove units made to fit food trucks.', 'assets/img/products/food-truck-stove-1.jpg', 16),
(17, 'Kitchen Equipment', 'kitchen-equipment', 'Gravy machines, warmers, kadai and more', 'Supporting equipment for commercial kitchens: gravy machines, electric kadai, food warmers, menu stands, dustbins and more.', 'assets/img/products/gravy-machine-2-hp-1.jpg', 17),
(18, 'Kitchen Setup', 'kitchen-setup', 'Complete commercial kitchen planning & installation', 'Complete commercial kitchen setups — from a measured layout drawing to fabrication, exhaust and installation — for restaurants, hotels, canteens and cloud kitchens.', 'assets/img/products/complete-commercial-kitchen-setup-1.jpg', 18);

INSERT INTO products (category_id, name, slug, short_description, description, specs, images, is_featured, sort_order) VALUES
(1, 'Three Burner Range 24×72×30', 'three-burner-range-24x72x30', 'A stainless-steel cooking range for restaurant and hotel hot lines. Size 24 × 72 × 30 in.', 'A stainless-steel cooking range for restaurant and hotel hot lines. Built on a rigid stainless-steel frame with high-pressure burners, pot rests and an under shelf for storage.

The model shown is 24 × 72 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Cooking Range","Size (inches)":"24 × 72 × 30","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/three-burner-range-24x72x30-1.jpg"]', 1, 1),
(1, 'Two Burner Range 24×46×30', 'two-burner-range-24x46x30', 'A stainless-steel cooking range for restaurant and hotel hot lines. Size 24 × 46 × 30 in.', 'A stainless-steel cooking range for restaurant and hotel hot lines. Built on a rigid stainless-steel frame with high-pressure burners, pot rests and an under shelf for storage.

The model shown is 24 × 46 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Cooking Range","Size (inches)":"24 × 46 × 30","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/two-burner-range-24x46x30-1.jpg","assets/img/products/two-burner-range-24x46x30-2.jpg"]', 0, 2),
(1, 'Double Burner Range with Under Shelf 24×46×30', 'double-burner-range-with-under-shelf-24x46x30', 'A stainless-steel cooking range for restaurant and hotel hot lines. Size 24 × 46 × 30 in.', 'A stainless-steel cooking range for restaurant and hotel hot lines. Built on a rigid stainless-steel frame with high-pressure burners, pot rests and an under shelf for storage.

The model shown is 24 × 46 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Cooking Range","Size (inches)":"24 × 46 × 30","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/double-burner-range-with-under-shelf-24x46x30-1.jpg"]', 1, 3),
(1, 'Single Burner Range 24×24×30', 'single-burner-range-24x24x30', 'A stainless-steel cooking range for restaurant and hotel hot lines. Size 24 × 24 × 30 in.', 'A stainless-steel cooking range for restaurant and hotel hot lines. Built on a rigid stainless-steel frame with high-pressure burners, pot rests and an under shelf for storage.

The model shown is 24 × 24 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Cooking Range","Size (inches)":"24 × 24 × 30","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/single-burner-range-24x24x30-1.jpg","assets/img/products/single-burner-range-24x24x30-2.jpg","assets/img/products/single-burner-range-24x24x30-3.jpg"]', 0, 4),
(1, 'Four Burner Dom Stove Range 36×36×30', 'four-burner-dom-stove-range-36x36x30', 'A stainless-steel cooking range for restaurant and hotel hot lines. Size 36 × 36 × 30 in.', 'A stainless-steel cooking range for restaurant and hotel hot lines. Built on a rigid stainless-steel frame with high-pressure burners, pot rests and an under shelf for storage.

The model shown is 36 × 36 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Cooking Range","Size (inches)":"36 × 36 × 30","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/four-burner-dom-stove-range-36x36x30-1.jpg"]', 1, 5),
(1, 'T-35 Chinese Stove 15×15×30', 't-35-chinese-stove-15x15x30', 'A stainless-steel cooking range for restaurant and hotel hot lines. Size 15 × 15 × 30 in.', 'A stainless-steel cooking range for restaurant and hotel hot lines. Built on a rigid stainless-steel frame with high-pressure burners, pot rests and an under shelf for storage.

The model shown is 15 × 15 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Cooking Range","Size (inches)":"15 × 15 × 30","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/t-35-chinese-stove-15x15x30-1.jpg"]', 0, 6),
(1, 'Super Dom Stove on Stand 15×42×30', 'super-dom-stove-on-stand-15x42x30', 'A stainless-steel cooking range for restaurant and hotel hot lines. Size 15 × 42 × 30 in.', 'A stainless-steel cooking range for restaurant and hotel hot lines. Built on a rigid stainless-steel frame with high-pressure burners, pot rests and an under shelf for storage.

The model shown is 15 × 42 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Cooking Range","Size (inches)":"15 × 42 × 30","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/super-dom-stove-on-stand-15x42x30-1.jpg"]', 0, 7),
(1, 'Custom Two Burner Range 24×42×30', 'custom-two-burner-range-24x42x30', 'A stainless-steel cooking range for restaurant and hotel hot lines. Size 24 × 42 × 30 in.', 'A stainless-steel cooking range for restaurant and hotel hot lines. Built on a rigid stainless-steel frame with high-pressure burners, pot rests and an under shelf for storage.

The model shown is 24 × 42 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Cooking Range","Size (inches)":"24 × 42 × 30","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/custom-two-burner-range-24x42x30-1.jpg"]', 0, 8),
(1, 'Custom Single Stove Counter 24×60×30', 'custom-single-stove-counter-24x60x30', 'A stainless-steel cooking range for restaurant and hotel hot lines. Size 24 × 60 × 30 in.', 'A stainless-steel cooking range for restaurant and hotel hot lines. Built on a rigid stainless-steel frame with high-pressure burners, pot rests and an under shelf for storage.

The model shown is 24 × 60 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Cooking Range","Size (inches)":"24 × 60 × 30","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/custom-single-stove-counter-24x60x30-1.jpg"]', 0, 9),
(1, 'Custom Cooking Counter', 'custom-cooking-counter', 'A stainless-steel cooking range for restaurant and hotel hot lines.', 'A stainless-steel cooking range for restaurant and hotel hot lines. Built on a rigid stainless-steel frame with high-pressure burners, pot rests and an under shelf for storage.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Cooking Range","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/custom-cooking-counter-1.jpg"]', 0, 10),
(2, 'Dom Stove 12×12×8', 'dom-stove-12x12x8', 'A heavy cast-iron dom stove for large vessels and bulk cooking. Size 12 × 12 × 8 in.', 'A heavy cast-iron dom stove for large vessels and bulk cooking. The low, stable frame holds big handis and kadhais safely, and the cast burner gives a strong, steady flame for long cooking hours.

The model shown is 12 × 12 × 8 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Single Dom Burner","Size (inches)":"12 × 12 × 8","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/dom-stove-12x12x8-1.jpg"]', 0, 1),
(2, 'Super Dom Stove 15×15×8', 'super-dom-stove-15x15x8', 'A heavy cast-iron dom stove for large vessels and bulk cooking. Size 15 × 15 × 8 in.', 'A heavy cast-iron dom stove for large vessels and bulk cooking. The low, stable frame holds big handis and kadhais safely, and the cast burner gives a strong, steady flame for long cooking hours.

The model shown is 15 × 15 × 8 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Single Dom Burner","Size (inches)":"15 × 15 × 8","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/super-dom-stove-15x15x8-1.jpg"]', 0, 2),
(2, 'Mini Stove 12×12×8', 'mini-stove-12x12x8', 'A heavy cast-iron dom stove for large vessels and bulk cooking. Size 12 × 12 × 8 in.', 'A heavy cast-iron dom stove for large vessels and bulk cooking. The low, stable frame holds big handis and kadhais safely, and the cast burner gives a strong, steady flame for long cooking hours.

The model shown is 12 × 12 × 8 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Single Dom Burner","Size (inches)":"12 × 12 × 8","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/mini-stove-12x12x8-1.jpg"]', 0, 3),
(2, 'Bobby Stove 10×10×8', 'bobby-stove-10x10x8', 'A heavy cast-iron dom stove for large vessels and bulk cooking. Size 10 × 10 × 8 in.', 'A heavy cast-iron dom stove for large vessels and bulk cooking. The low, stable frame holds big handis and kadhais safely, and the cast burner gives a strong, steady flame for long cooking hours.

The model shown is 10 × 10 × 8 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Single Dom Burner","Size (inches)":"10 × 10 × 8","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/bobby-stove-10x10x8-1.jpg"]', 0, 4),
(2, 'Super Stove 15×15×8', 'super-stove-15x15x8', 'A heavy cast-iron dom stove for large vessels and bulk cooking. Size 15 × 15 × 8 in.', 'A heavy cast-iron dom stove for large vessels and bulk cooking. The low, stable frame holds big handis and kadhais safely, and the cast burner gives a strong, steady flame for long cooking hours.

The model shown is 15 × 15 × 8 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Single Dom Burner","Size (inches)":"15 × 15 × 8","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/super-stove-15x15x8-1.jpg"]', 0, 5),
(2, 'Bobby Dom Stove 10×10×8', 'bobby-dom-stove-10x10x8', 'A heavy cast-iron dom stove for large vessels and bulk cooking. Size 10 × 10 × 8 in.', 'A heavy cast-iron dom stove for large vessels and bulk cooking. The low, stable frame holds big handis and kadhais safely, and the cast burner gives a strong, steady flame for long cooking hours.

The model shown is 10 × 10 × 8 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Single Dom Burner","Size (inches)":"10 × 10 × 8","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/bobby-dom-stove-10x10x8-1.jpg"]', 0, 6),
(2, 'Dom Super Burner 15×15×8', 'dom-super-burner-15x15x8', 'A heavy cast-iron dom stove for large vessels and bulk cooking. Size 15 × 15 × 8 in.', 'A heavy cast-iron dom stove for large vessels and bulk cooking. The low, stable frame holds big handis and kadhais safely, and the cast burner gives a strong, steady flame for long cooking hours.

The model shown is 15 × 15 × 8 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Single Dom Burner","Size (inches)":"15 × 15 × 8","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/dom-super-burner-15x15x8-1.jpg"]', 0, 7),
(2, 'Dom Stove 30×30×12', 'dom-stove-30x30x12', 'A heavy cast-iron dom stove for large vessels and bulk cooking. Size 30 × 30 × 12 in.', 'A heavy cast-iron dom stove for large vessels and bulk cooking. The low, stable frame holds big handis and kadhais safely, and the cast burner gives a strong, steady flame for long cooking hours.

The model shown is 30 × 30 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Single Dom Burner","Size (inches)":"30 × 30 × 12","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/dom-stove-30x30x12-1.jpg"]', 0, 8),
(2, 'Dom Jumbo Stove 24×24×12', 'dom-jumbo-stove-24x24x12', 'A heavy cast-iron dom stove for large vessels and bulk cooking. Size 24 × 24 × 12 in.', 'A heavy cast-iron dom stove for large vessels and bulk cooking. The low, stable frame holds big handis and kadhais safely, and the cast burner gives a strong, steady flame for long cooking hours.

The model shown is 24 × 24 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Single Dom Burner","Size (inches)":"24 × 24 × 12","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/dom-jumbo-stove-24x24x12-1.jpg","assets/img/products/dom-jumbo-stove-24x24x12-2.jpg"]', 1, 9),
(2, 'Dom Jumbo Stove 30×30×12', 'dom-jumbo-stove-30x30x12', 'A heavy cast-iron dom stove for large vessels and bulk cooking. Size 30 × 30 × 12 in.', 'A heavy cast-iron dom stove for large vessels and bulk cooking. The low, stable frame holds big handis and kadhais safely, and the cast burner gives a strong, steady flame for long cooking hours.

The model shown is 30 × 30 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Single Dom Burner","Size (inches)":"30 × 30 × 12","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/dom-jumbo-stove-30x30x12-1.jpg"]', 0, 10),
(2, 'Classic CI Stove 30×30×6', 'classic-ci-stove-30x30x6', 'A heavy cast-iron dom stove for large vessels and bulk cooking. Size 30 × 30 × 6 in.', 'A heavy cast-iron dom stove for large vessels and bulk cooking. The low, stable frame holds big handis and kadhais safely, and the cast burner gives a strong, steady flame for long cooking hours.

The model shown is 30 × 30 × 6 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Single Dom Burner","Size (inches)":"30 × 30 × 6","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/classic-ci-stove-30x30x6-1.jpg"]', 0, 11),
(3, 'Mini Burner 12×33×8', 'mini-burner-12x33x8', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Size 12 × 33 × 8 in.', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Run several large vessels at once — each burner has its own valve so you only use the heat you need.

The model shown is 12 × 33 × 8 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Double Dom Burner","Size (inches)":"12 × 33 × 8","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/mini-burner-12x33x8-1.jpg"]', 0, 1),
(3, 'Mini Double Dom Stove 12×33×30', 'mini-double-dom-stove-12x33x30', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Size 12 × 33 × 30 in.', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Run several large vessels at once — each burner has its own valve so you only use the heat you need.

The model shown is 12 × 33 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Double Dom Burner","Size (inches)":"12 × 33 × 30","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/mini-double-dom-stove-12x33x30-1.jpg"]', 0, 2),
(3, 'Super Dom Stove — Double 15×42×9', 'super-dom-stove-double-15x42x9', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Size 15 × 42 × 9 in.', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Run several large vessels at once — each burner has its own valve so you only use the heat you need.

The model shown is 15 × 42 × 9 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Double Dom Burner","Size (inches)":"15 × 42 × 9","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/super-dom-stove-double-15x42x9-1.jpg","assets/img/products/super-dom-stove-double-15x42x9-2.jpg"]', 0, 3),
(3, 'Bobby Double Burner 10×24×8', 'bobby-double-burner-10x24x8', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Size 10 × 24 × 8 in.', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Run several large vessels at once — each burner has its own valve so you only use the heat you need.

The model shown is 10 × 24 × 8 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Double Dom Burner","Size (inches)":"10 × 24 × 8","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/bobby-double-burner-10x24x8-1.jpg"]', 0, 4),
(3, 'Double Burner', 'double-burner', 'Multiple dom burners on one sturdy frame for side-by-side cooking.', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Run several large vessels at once — each burner has its own valve so you only use the heat you need.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Double Dom Burner","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/double-burner-1.jpg"]', 0, 5),
(3, 'Super Double Burner 15×42×8', 'super-double-burner-15x42x8', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Size 15 × 42 × 8 in.', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Run several large vessels at once — each burner has its own valve so you only use the heat you need.

The model shown is 15 × 42 × 8 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Double Dom Burner","Size (inches)":"15 × 42 × 8","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/super-double-burner-15x42x8-1.jpg"]', 1, 6),
(3, 'Dom Three Burner 12×54×8', 'dom-three-burner-12x54x8', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Size 12 × 54 × 8 in.', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Run several large vessels at once — each burner has its own valve so you only use the heat you need.

The model shown is 12 × 54 × 8 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Double Dom Burner","Size (inches)":"12 × 54 × 8","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/dom-three-burner-12x54x8-1.jpg"]', 0, 7),
(3, 'Mini Three Burner with Dom Stove 12×54×8', 'mini-three-burner-with-dom-stove-12x54x8', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Size 12 × 54 × 8 in.', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Run several large vessels at once — each burner has its own valve so you only use the heat you need.

The model shown is 12 × 54 × 8 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Double Dom Burner","Size (inches)":"12 × 54 × 8","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/mini-three-burner-with-dom-stove-12x54x8-1.jpg"]', 0, 8),
(3, 'Dom Stove — Three in Line', 'dom-stove-three-in-line', 'Multiple dom burners on one sturdy frame for side-by-side cooking.', 'Multiple dom burners on one sturdy frame for side-by-side cooking. Run several large vessels at once — each burner has its own valve so you only use the heat you need.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Double Dom Burner","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/dom-stove-three-in-line-1.jpg"]', 0, 9),
(4, 'Puffer Bhatti 18×24×12', 'puffer-bhatti-18x24x12', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. Size 18 × 24 × 12 in.', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. The insulated body keeps heat on the vessel, cutting gas use and keeping the kitchen cooler.

The model shown is 18 × 24 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Puffer Bhatti","Size (inches)":"18 × 24 × 12","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/puffer-bhatti-18x24x12-1.jpg"]', 0, 1),
(4, 'Puffer Bhatti 18×30×12', 'puffer-bhatti-18x30x12', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. Size 18 × 30 × 12 in.', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. The insulated body keeps heat on the vessel, cutting gas use and keeping the kitchen cooler.

The model shown is 18 × 30 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Puffer Bhatti","Size (inches)":"18 × 30 × 12","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/puffer-bhatti-18x30x12-1.jpg"]', 0, 2),
(4, 'Puffer Bhatti 18×36', 'puffer-bhatti-18x36', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. Size 18 × 36 in.', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. The insulated body keeps heat on the vessel, cutting gas use and keeping the kitchen cooler.

The model shown is 18 × 36 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Puffer Bhatti","Size (inches)":"18 × 36","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/puffer-bhatti-18x36-1.jpg"]', 0, 3),
(4, 'Puffer Bhatti 24×36×30', 'puffer-bhatti-24x36x30', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. Size 24 × 36 × 30 in.', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. The insulated body keeps heat on the vessel, cutting gas use and keeping the kitchen cooler.

The model shown is 24 × 36 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Puffer Bhatti","Size (inches)":"24 × 36 × 30","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/puffer-bhatti-24x36x30-1.jpg"]', 0, 4),
(4, 'New Puffer Bhatti 18×36×12', 'new-puffer-bhatti-18x36x12', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. Size 18 × 36 × 12 in.', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. The insulated body keeps heat on the vessel, cutting gas use and keeping the kitchen cooler.

The model shown is 18 × 36 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Puffer Bhatti","Size (inches)":"18 × 36 × 12","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/new-puffer-bhatti-18x36x12-1.jpg"]', 0, 5),
(4, 'Bullet Puffer Bhatti 15×36×12', 'bullet-puffer-bhatti-15x36x12', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. Size 15 × 36 × 12 in.', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. The insulated body keeps heat on the vessel, cutting gas use and keeping the kitchen cooler.

The model shown is 15 × 36 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Puffer Bhatti","Size (inches)":"15 × 36 × 12","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/bullet-puffer-bhatti-15x36x12-1.jpg"]', 1, 6),
(4, 'Bullet Puffer Bhatti 24×30', 'bullet-puffer-bhatti-24x30', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. Size 24 × 30 in.', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. The insulated body keeps heat on the vessel, cutting gas use and keeping the kitchen cooler.

The model shown is 24 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Puffer Bhatti","Size (inches)":"24 × 30","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/bullet-puffer-bhatti-24x30-1.jpg"]', 0, 7),
(4, 'Bullet Puffer Bhatti 24×36×12', 'bullet-puffer-bhatti-24x36x12', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. Size 24 × 36 × 12 in.', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. The insulated body keeps heat on the vessel, cutting gas use and keeping the kitchen cooler.

The model shown is 24 × 36 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Puffer Bhatti","Size (inches)":"24 × 36 × 12","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/bullet-puffer-bhatti-24x36x12-1.jpg"]', 0, 8),
(4, 'Bullet Puffer Bhatti 15×42×12', 'bullet-puffer-bhatti-15x42x12', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. Size 15 × 42 × 12 in.', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. The insulated body keeps heat on the vessel, cutting gas use and keeping the kitchen cooler.

The model shown is 15 × 42 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Puffer Bhatti","Size (inches)":"15 × 42 × 12","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/bullet-puffer-bhatti-15x42x12-1.jpg"]', 0, 9),
(4, 'Ceramic Bullet Puffer Bhatti 15×36×12', 'ceramic-bullet-puffer-bhatti-15x36x12', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. Size 15 × 36 × 12 in.', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. The insulated body keeps heat on the vessel, cutting gas use and keeping the kitchen cooler.

The model shown is 15 × 36 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Puffer Bhatti","Size (inches)":"15 × 36 × 12","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/ceramic-bullet-puffer-bhatti-15x36x12-1.jpg"]', 0, 10),
(4, 'T Bhatti 10×10×8', 't-bhatti-10x10x8', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. Size 10 × 10 × 8 in.', 'A forced-flame bhatti for frying, sweets, farsan and bulk boiling. The insulated body keeps heat on the vessel, cutting gas use and keeping the kitchen cooler.

The model shown is 10 × 10 × 8 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Puffer Bhatti","Size (inches)":"10 × 10 × 8","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/t-bhatti-10x10x8-1.jpg"]', 0, 11),
(5, 'Dhosa Bhatti 18×30×12', 'dhosa-bhatti-18x30x12', 'A dosa station with even heat across the full plate. Size 18 × 30 × 12 in.', 'A dosa station with even heat across the full plate. Burners run under the length of the plate so every dosa cooks evenly, from the first order to the last.

The model shown is 18 × 30 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Dhosa Bhatti","Size (inches)":"18 × 30 × 12","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/dhosa-bhatti-18x30x12-1.jpg"]', 0, 1),
(5, 'Dhosa Bhatti 18×42×12', 'dhosa-bhatti-18x42x12', 'A dosa station with even heat across the full plate. Size 18 × 42 × 12 in.', 'A dosa station with even heat across the full plate. Burners run under the length of the plate so every dosa cooks evenly, from the first order to the last.

The model shown is 18 × 42 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Dhosa Bhatti","Size (inches)":"18 × 42 × 12","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/dhosa-bhatti-18x42x12-1.jpg"]', 0, 2),
(5, 'Dhosa Bhatti 18×36×30', 'dhosa-bhatti-18x36x30', 'A dosa station with even heat across the full plate. Size 18 × 36 × 30 in.', 'A dosa station with even heat across the full plate. Burners run under the length of the plate so every dosa cooks evenly, from the first order to the last.

The model shown is 18 × 36 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Dhosa Bhatti","Size (inches)":"18 × 36 × 30","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/dhosa-bhatti-18x36x30-1.jpg"]', 0, 3),
(5, 'Dhosa Bhatti 24×36×12', 'dhosa-bhatti-24x36x12', 'A dosa station with even heat across the full plate. Size 24 × 36 × 12 in.', 'A dosa station with even heat across the full plate. Burners run under the length of the plate so every dosa cooks evenly, from the first order to the last.

The model shown is 24 × 36 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Dhosa Bhatti","Size (inches)":"24 × 36 × 12","Fuel \\/ power":"LPG \\/ PNG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/dhosa-bhatti-24x36x12-1.jpg"]', 1, 4),
(5, 'Electric Dhosa Bhatti', 'electric-dhosa-bhatti', 'A dosa station with even heat across the full plate.', 'A dosa station with even heat across the full plate. Burners run under the length of the plate so every dosa cooks evenly, from the first order to the last.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Dhosa Bhatti","Fuel \\/ power":"Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/electric-dhosa-bhatti-1.jpg"]', 0, 5),
(6, 'Round Stove 10×10×10', 'round-stove-10x10x10', 'A round-body stove for high-heat cooking. Size 10 × 10 × 10 in.', 'A round-body stove for high-heat cooking. Heavy construction and a cast burner make it suited to continuous use in dhabas, caterers and restaurants.

The model shown is 10 × 10 × 10 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Round & Rumali Stove","Size (inches)":"10 × 10 × 10","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/round-stove-10x10x10-1.jpg"]', 0, 1),
(6, 'Round Stove 12×12×10', 'round-stove-12x12x10', 'A round-body stove for high-heat cooking. Size 12 × 12 × 10 in.', 'A round-body stove for high-heat cooking. Heavy construction and a cast burner make it suited to continuous use in dhabas, caterers and restaurants.

The model shown is 12 × 12 × 10 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Round & Rumali Stove","Size (inches)":"12 × 12 × 10","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/round-stove-12x12x10-1.jpg"]', 0, 2),
(6, 'Round Rumali Stove 18×18×12', 'round-rumali-stove-18x18x12', 'A round-body stove for high-heat cooking. Size 18 × 18 × 12 in.', 'A round-body stove for high-heat cooking. Heavy construction and a cast burner make it suited to continuous use in dhabas, caterers and restaurants.

The model shown is 18 × 18 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Round & Rumali Stove","Size (inches)":"18 × 18 × 12","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/round-rumali-stove-18x18x12-1.jpg"]', 0, 3),
(6, 'Round Ring Jumbo Stove 30×30×15', 'round-ring-jumbo-stove-30x30x15', 'A round-body stove for high-heat cooking. Size 30 × 30 × 15 in.', 'A round-body stove for high-heat cooking. Heavy construction and a cast burner make it suited to continuous use in dhabas, caterers and restaurants.

The model shown is 30 × 30 × 15 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Round & Rumali Stove","Size (inches)":"30 × 30 × 15","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/round-ring-jumbo-stove-30x30x15-1.jpg"]', 0, 4),
(6, 'Half Round Catering Stove 15×15×7', 'half-round-catering-stove-15x15x7', 'A round-body stove for high-heat cooking. Size 15 × 15 × 7 in.', 'A round-body stove for high-heat cooking. Heavy construction and a cast burner make it suited to continuous use in dhabas, caterers and restaurants.

The model shown is 15 × 15 × 7 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Round & Rumali Stove","Size (inches)":"15 × 15 × 7","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/half-round-catering-stove-15x15x7-1.jpg"]', 0, 5),
(7, 'Ring Burner', 'ring-burner', 'A cast-iron ring burner for bhattis and dom stoves.', 'A cast-iron ring burner for bhattis and dom stoves. Available as a replacement part or fitted into new fabrication.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Ring Burner","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/ring-burner-1.jpg"]', 0, 1),
(7, 'Ring Burner 3-in-1', 'ring-burner-3-in-1', 'A cast-iron ring burner for bhattis and dom stoves.', 'A cast-iron ring burner for bhattis and dom stoves. Available as a replacement part or fitted into new fabrication.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Ring Burner","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/ring-burner-3-in-1-1.jpg"]', 0, 2),
(8, 'Service Trolley', 'service-trolley', 'A stainless-steel trolley for moving food, utensils or waste.', 'A stainless-steel trolley for moving food, utensils or waste. Welded construction with smooth-rolling castors for daily use in kitchens, canteens and banquet halls.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Transport Trolley","Customisation":"Size and finish as per requirement"}', '["assets/img/products/service-trolley-1.jpg"]', 0, 1),
(8, 'Dumping Trolley', 'dumping-trolley', 'A stainless-steel trolley for moving food, utensils or waste.', 'A stainless-steel trolley for moving food, utensils or waste. Welded construction with smooth-rolling castors for daily use in kitchens, canteens and banquet halls.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Transport Trolley","Customisation":"Size and finish as per requirement"}', '["assets/img/products/dumping-trolley-1.jpg"]', 0, 2),
(8, 'Simple Trolley', 'simple-trolley', 'A stainless-steel trolley for moving food, utensils or waste.', 'A stainless-steel trolley for moving food, utensils or waste. Welded construction with smooth-rolling castors for daily use in kitchens, canteens and banquet halls.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Transport Trolley","Customisation":"Size and finish as per requirement"}', '["assets/img/products/simple-trolley-1.jpg"]', 0, 3),
(9, 'Two Shelf Table 24×46×30', 'two-shelf-table-24x46x30', 'A stainless-steel table for hygienic prep, plating and storage. Size 24 × 46 × 30 in.', 'A stainless-steel table for hygienic prep, plating and storage. Strong frame, easy-to-clean surface and levelling feet.

The model shown is 24 × 46 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Table","Size (inches)":"24 × 46 × 30","Customisation":"Size and finish as per requirement"}', '["assets/img/products/two-shelf-table-24x46x30-1.jpg"]', 0, 1),
(9, 'Three Shelf Table 24×46×36', 'three-shelf-table-24x46x36', 'A stainless-steel table for hygienic prep, plating and storage. Size 24 × 46 × 36 in.', 'A stainless-steel table for hygienic prep, plating and storage. Strong frame, easy-to-clean surface and levelling feet.

The model shown is 24 × 46 × 36 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Table","Size (inches)":"24 × 46 × 36","Customisation":"Size and finish as per requirement"}', '["assets/img/products/three-shelf-table-24x46x36-1.jpg"]', 1, 2),
(9, 'Pick-up Table 24×46×36', 'pick-up-table-24x46x36', 'A stainless-steel table for hygienic prep, plating and storage. Size 24 × 46 × 36 in.', 'A stainless-steel table for hygienic prep, plating and storage. Strong frame, easy-to-clean surface and levelling feet.

The model shown is 24 × 46 × 36 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Table","Size (inches)":"24 × 46 × 36","Customisation":"Size and finish as per requirement"}', '["assets/img/products/pick-up-table-24x46x36-1.jpg"]', 0, 3),
(9, 'Folding Table 24×46×42', 'folding-table-24x46x42', 'A stainless-steel table for hygienic prep, plating and storage. Size 24 × 46 × 42 in.', 'A stainless-steel table for hygienic prep, plating and storage. Strong frame, easy-to-clean surface and levelling feet.

The model shown is 24 × 46 × 42 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Table","Size (inches)":"24 × 46 × 42","Customisation":"Size and finish as per requirement"}', '["assets/img/products/folding-table-24x46x42-1.jpg","assets/img/products/folding-table-24x46x42-2.jpg"]', 0, 4),
(9, 'Folding Table 24×46×30', 'folding-table-24x46x30', 'A stainless-steel table for hygienic prep, plating and storage. Size 24 × 46 × 30 in.', 'A stainless-steel table for hygienic prep, plating and storage. Strong frame, easy-to-clean surface and levelling feet.

The model shown is 24 × 46 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Table","Size (inches)":"24 × 46 × 30","Customisation":"Size and finish as per requirement"}', '["assets/img/products/folding-table-24x46x30-1.jpg"]', 0, 5),
(9, 'Storage Rack 15×46×72', 'storage-rack-15x46x72', 'A stainless-steel table for hygienic prep, plating and storage. Size 15 × 46 × 72 in.', 'A stainless-steel table for hygienic prep, plating and storage. Strong frame, easy-to-clean surface and levelling feet.

The model shown is 15 × 46 × 72 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Table","Size (inches)":"15 × 46 × 72","Customisation":"Size and finish as per requirement"}', '["assets/img/products/storage-rack-15x46x72-1.jpg"]', 0, 6),
(10, 'Single Sink 24×46×30', 'single-sink-24x46x30', 'A commercial stainless-steel sink for busy wash areas. Size 24 × 46 × 30 in.', 'A commercial stainless-steel sink for busy wash areas. Deep bowls take large pots and trays; the under shelf keeps cleaning supplies close at hand.

The model shown is 24 × 46 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Sink","Size (inches)":"24 × 46 × 30","Customisation":"Size and finish as per requirement"}', '["assets/img/products/single-sink-24x46x30-1.jpg"]', 0, 1),
(10, 'Double Sink 24×72×30', 'double-sink-24x72x30', 'A commercial stainless-steel sink for busy wash areas. Size 24 × 72 × 30 in.', 'A commercial stainless-steel sink for busy wash areas. Deep bowls take large pots and trays; the under shelf keeps cleaning supplies close at hand.

The model shown is 24 × 72 × 30 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Sink","Size (inches)":"24 × 72 × 30","Customisation":"Size and finish as per requirement"}', '["assets/img/products/double-sink-24x72x30-1.jpg"]', 1, 2),
(11, 'Electric Sandwich Griller 12×12', 'electric-sandwich-griller-12x12', 'Fast, consistent grilling for cafés, counters and kebab stations. Size 12 × 12 in.', 'Fast, consistent grilling for cafés, counters and kebab stations. Built for continuous service and easy cleaning.

The model shown is 12 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Griller","Size (inches)":"12 × 12","Fuel \\/ power":"Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/electric-sandwich-griller-12x12-1.jpg","assets/img/products/electric-sandwich-griller-12x12-2.jpg"]', 1, 1),
(11, 'Electric Griller — Compact 12×12', 'electric-griller-compact-12x12', 'Fast, consistent grilling for cafés, counters and kebab stations. Size 12 × 12 in.', 'Fast, consistent grilling for cafés, counters and kebab stations. Built for continuous service and easy cleaning.

The model shown is 12 × 12 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Griller","Size (inches)":"12 × 12","Fuel \\/ power":"Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/electric-griller-compact-12x12-1.jpg"]', 0, 2),
(11, 'Gas Barbeque 13×25×48', 'gas-barbeque-13x25x48', 'Fast, consistent grilling for cafés, counters and kebab stations. Size 13 × 25 × 48 in.', 'Fast, consistent grilling for cafés, counters and kebab stations. Built for continuous service and easy cleaning.

The model shown is 13 × 25 × 48 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Griller","Size (inches)":"13 × 25 × 48","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/gas-barbeque-13x25x48-1.jpg","assets/img/products/gas-barbeque-13x25x48-2.jpg"]', 0, 3),
(11, 'Charcoal Barbeque 12×24×48', 'charcoal-barbeque-12x24x48', 'Fast, consistent grilling for cafés, counters and kebab stations. Size 12 × 24 × 48 in.', 'Fast, consistent grilling for cafés, counters and kebab stations. Built for continuous service and easy cleaning.

The model shown is 12 × 24 × 48 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Griller","Size (inches)":"12 × 24 × 48","Fuel \\/ power":"Charcoal","Customisation":"Size and finish as per requirement"}', '["assets/img/products/charcoal-barbeque-12x24x48-1.jpg"]', 0, 4),
(12, 'Gas Pizza Oven', 'gas-pizza-oven', 'A commercial oven for consistent results batch after batch.', 'A commercial oven for consistent results batch after batch. Insulated body and simple controls for cafés, bakeries and farsan shops.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Oven","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/gas-pizza-oven-1.jpg"]', 1, 1),
(12, 'Pizza Oven 12×18', 'pizza-oven-12x18', 'A commercial oven for consistent results batch after batch. Size 12 × 18 in.', 'A commercial oven for consistent results batch after batch. Insulated body and simple controls for cafés, bakeries and farsan shops.

The model shown is 12 × 18 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Oven","Size (inches)":"12 × 18","Fuel \\/ power":"Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/pizza-oven-12x18-1.jpg"]', 0, 2),
(12, 'Pizza Oven 10×16', 'pizza-oven-10x16', 'A commercial oven for consistent results batch after batch. Size 10 × 16 in.', 'A commercial oven for consistent results batch after batch. Insulated body and simple controls for cafés, bakeries and farsan shops.

The model shown is 10 × 16 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Oven","Size (inches)":"10 × 16","Fuel \\/ power":"Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/pizza-oven-10x16-1.jpg"]', 0, 3),
(12, 'Dhokla Idli Gas Oven', 'dhokla-idli-gas-oven', 'A commercial oven for consistent results batch after batch.', 'A commercial oven for consistent results batch after batch. Insulated body and simple controls for cafés, bakeries and farsan shops.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Oven","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/dhokla-idli-gas-oven-1.jpg","assets/img/products/dhokla-idli-gas-oven-2.jpg"]', 0, 4),
(13, '4 Pavali Ben Marie', '4-pavali-ben-marie', 'A Ben Marie counter that keeps food hot and ready to serve.', 'A Ben Marie counter that keeps food hot and ready to serve. A hot-water bath holds curries, dal and rice at serving temperature without scorching.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Ben Marie","Fuel \\/ power":"Gas \\/ Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/4-pavali-ben-marie-1.jpg"]', 0, 1),
(13, '6 Pavali Ben Marie', '6-pavali-ben-marie', 'A Ben Marie counter that keeps food hot and ready to serve.', 'A Ben Marie counter that keeps food hot and ready to serve. A hot-water bath holds curries, dal and rice at serving temperature without scorching.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Ben Marie","Fuel \\/ power":"Gas \\/ Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/6-pavali-ben-marie-1.jpg"]', 0, 2),
(13, '8 Pavali Ben Marie with Overhead Shelf', '8-pavali-ben-marie-with-overhead-shelf', 'A Ben Marie counter that keeps food hot and ready to serve.', 'A Ben Marie counter that keeps food hot and ready to serve. A hot-water bath holds curries, dal and rice at serving temperature without scorching.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Ben Marie","Fuel \\/ power":"Gas \\/ Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/8-pavali-ben-marie-with-overhead-shelf-1.jpg"]', 1, 3),
(13, '4 GN Pan Ben Marie', '4-gn-pan-ben-marie', 'A Ben Marie counter that keeps food hot and ready to serve.', 'A Ben Marie counter that keeps food hot and ready to serve. A hot-water bath holds curries, dal and rice at serving temperature without scorching.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Ben Marie","Fuel \\/ power":"Gas \\/ Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/4-gn-pan-ben-marie-1.jpg"]', 0, 4),
(13, '5 GN Pan Ben Marie', '5-gn-pan-ben-marie', 'A Ben Marie counter that keeps food hot and ready to serve.', 'A Ben Marie counter that keeps food hot and ready to serve. A hot-water bath holds curries, dal and rice at serving temperature without scorching.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Ben Marie","Fuel \\/ power":"Gas \\/ Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/5-gn-pan-ben-marie-1.jpg"]', 0, 5),
(13, '2 GN Pan Double Body Ben Marie', '2-gn-pan-double-body-ben-marie', 'A Ben Marie counter that keeps food hot and ready to serve.', 'A Ben Marie counter that keeps food hot and ready to serve. A hot-water bath holds curries, dal and rice at serving temperature without scorching.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Ben Marie","Fuel \\/ power":"Gas \\/ Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/2-gn-pan-double-body-ben-marie-1.jpg"]', 0, 6),
(13, 'Custom Ben Marie Counter', 'custom-ben-marie-counter', 'A Ben Marie counter that keeps food hot and ready to serve.', 'A Ben Marie counter that keeps food hot and ready to serve. A hot-water bath holds curries, dal and rice at serving temperature without scorching.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Ben Marie","Fuel \\/ power":"Gas \\/ Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/custom-ben-marie-counter-1.jpg"]', 0, 7),
(14, 'Shawarma Machine', 'shawarma-machine', 'A vertical shawarma broiler that roasts evenly on all sides.', 'A vertical shawarma broiler that roasts evenly on all sides. Adjustable gas burners and a stainless-steel body that is easy to clean.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Shawarma Machine","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/shawarma-machine-1.jpg","assets/img/products/shawarma-machine-2.jpg"]', 0, 1),
(14, 'Shawarma Machine with Counter', 'shawarma-machine-with-counter', 'A vertical shawarma broiler that roasts evenly on all sides.', 'A vertical shawarma broiler that roasts evenly on all sides. Adjustable gas burners and a stainless-steel body that is easy to clean.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Shawarma Machine","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/shawarma-machine-with-counter-1.jpg","assets/img/products/shawarma-machine-with-counter-2.jpg"]', 1, 2),
(15, 'Electric Tawa 15×15', 'electric-tawa-15x15', 'A heavy tava for dosa, uttapam and tawa fry. Size 15 × 15 in.', 'A heavy tava for dosa, uttapam and tawa fry. Holds heat well for even cooking through service.

The model shown is 15 × 15 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Dhosa Tava","Size (inches)":"15 × 15","Fuel \\/ power":"Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/electric-tawa-15x15-1.jpg"]', 0, 1),
(16, 'Food Truck Stove', 'food-truck-stove', 'A custom live-cooking unit built around your menu and space.', 'A custom live-cooking unit built around your menu and space. Fabricated in stainless steel to your measurements.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Counters & Food Truck","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/food-truck-stove-1.jpg","assets/img/products/food-truck-stove-2.jpg","assets/img/products/food-truck-stove-3.jpg"]', 1, 1),
(16, 'Rajwadi Counter', 'rajwadi-counter', 'A custom live-cooking unit built around your menu and space.', 'A custom live-cooking unit built around your menu and space. Fabricated in stainless steel to your measurements.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Counters & Food Truck","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/rajwadi-counter-1.jpg"]', 0, 2),
(16, 'Paneer Tikka Counter', 'paneer-tikka-counter', 'A custom live-cooking unit built around your menu and space.', 'A custom live-cooking unit built around your menu and space. Fabricated in stainless steel to your measurements.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Counters & Food Truck","Fuel \\/ power":"LPG","Customisation":"Size and finish as per requirement"}', '["assets/img/products/paneer-tikka-counter-1.jpg"]', 0, 3),
(17, 'Gravy Machine 2 HP', 'gravy-machine-2-hp', 'Supporting equipment for a professional kitchen.', 'Supporting equipment for a professional kitchen. Built for daily commercial use.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Kitchen Equipment","Fuel \\/ power":"Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/gravy-machine-2-hp-1.jpg"]', 0, 1),
(17, 'Electric Kadai 18×18', 'electric-kadai-18x18', 'Supporting equipment for a professional kitchen. Size 18 × 18 in.', 'Supporting equipment for a professional kitchen. Built for daily commercial use.

The model shown is 18 × 18 inches. Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Kitchen Equipment","Size (inches)":"18 × 18","Fuel \\/ power":"Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/electric-kadai-18x18-1.jpg"]', 0, 2),
(17, 'Two Bulb Food Warmer', 'two-bulb-food-warmer', 'Supporting equipment for a professional kitchen.', 'Supporting equipment for a professional kitchen. Built for daily commercial use.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Kitchen Equipment","Fuel \\/ power":"Electric","Customisation":"Size and finish as per requirement"}', '["assets/img/products/two-bulb-food-warmer-1.jpg"]', 0, 3),
(17, 'Menu Stand', 'menu-stand', 'Supporting equipment for a professional kitchen.', 'Supporting equipment for a professional kitchen. Built for daily commercial use.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Kitchen Equipment","Customisation":"Size and finish as per requirement"}', '["assets/img/products/menu-stand-1.jpg"]', 0, 4),
(17, 'SS Dustbin', 'ss-dustbin', 'Supporting equipment for a professional kitchen.', 'Supporting equipment for a professional kitchen. Built for daily commercial use.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Kitchen Equipment","Customisation":"Size and finish as per requirement"}', '["assets/img/products/ss-dustbin-1.jpg"]', 0, 5),
(18, 'Complete Commercial Kitchen Setup', 'complete-commercial-kitchen-setup', 'Complete commercial kitchen planning, fabrication and installation.', 'Complete commercial kitchen planning, fabrication and installation. We measure your space, plan the layout, fabricate the equipment and install it — one team from drawing to handover.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Kitchen Setup","Customisation":"Size and finish as per requirement"}', '["assets/img/products/complete-commercial-kitchen-setup-1.jpg"]', 0, 1),
(18, 'Kitchen Layout Planning', 'kitchen-layout-planning', 'Complete commercial kitchen planning, fabrication and installation.', 'Complete commercial kitchen planning, fabrication and installation. We measure your space, plan the layout, fabricate the equipment and install it — one team from drawing to handover.

Sizes, burner configuration and finish can be customised — share your requirement and we will quote the right model.', '{"Type":"Kitchen Setup","Customisation":"Size and finish as per requirement"}', '["assets/img/products/kitchen-layout-planning-1.jpg"]', 0, 2);

-- Real certificate: Trade Marks Registry, Government of India — SOLID (TM No. 2325476, Class 21)
INSERT INTO certificates (title, issued_by, year, image, sort_order) VALUES
('Trade Mark Registration — SOLID™', 'Trade Marks Registry, Government of India', '2012', 'assets/uploads/certificates/trademark-solid.jpg', 1);

-- Instagram reels (@royal_gas_stove_center): 15-second silent card previews + poster frames stored locally
-- (full-length originals are in assets/uploads/reels/originals/). Clicking a card opens the reel on Instagram.
INSERT INTO reels (title, link, poster, video, sort_order) VALUES
('Stainless-steel idli oven with 3 tray types', 'https://www.instagram.com/reel/Del1Cqcs_i3/', 'assets/uploads/reels/ig-Del1Cqcs_i3.jpg', 'assets/uploads/reels/ig-Del1Cqcs_i3.mp4', 1),
('New: SS working table with shelves & storage', 'https://www.instagram.com/reel/Dd8Kau3IeS9/', 'assets/uploads/reels/ig-Dd8Kau3IeS9.jpg', 'assets/uploads/reels/ig-Dd8Kau3IeS9.mp4', 2),
('New: SS nasta counter with burner & storage', 'https://www.instagram.com/reel/Dd3AyK0oWw2/', 'assets/uploads/reels/ig-Dd3AyK0oWw2.jpg', 'assets/uploads/reels/ig-Dd3AyK0oWw2.mp4', 3),
('New: SS bhaji pav counter with storage cabin', 'https://www.instagram.com/reel/Ddx3NhzIeu0/', 'assets/uploads/reels/ig-Ddx3NhzIeu0.jpg', 'assets/uploads/reels/ig-Ddx3NhzIeu0.mp4', 4),
('New: SS dal batti gas stove', 'https://www.instagram.com/reel/DdstqOCo2n2/', 'assets/uploads/reels/ig-DdstqOCo2n2.jpg', 'assets/uploads/reels/ig-DdstqOCo2n2.mp4', 5),
('Made by us. Made for your business.', 'https://www.instagram.com/reel/DbxatRqM4km/', 'assets/uploads/reels/ig-DbxatRqM4km.jpg', 'assets/uploads/reels/ig-DbxatRqM4km.mp4', 6),
('2 & 3 burner SS range in mirror finish', 'https://www.instagram.com/reel/DU4_juNDJuL/', 'assets/uploads/reels/ig-DU4_juNDJuL.jpg', 'assets/uploads/reels/ig-DU4_juNDJuL.mp4', 7),
('From one flame to three — single, double & triple burners', 'https://www.instagram.com/reel/DQ68NbJDM2c/', 'assets/uploads/reels/ig-DQ68NbJDM2c.jpg', 'assets/uploads/reels/ig-DQ68NbJDM2c.mp4', 8);

-- Real customer reviews, copied word for word from the public Google Business profile (Royal Gas Stove Center, Kalupur).
INSERT INTO testimonials (name, designation, product, message, rating, sort_order) VALUES
('Vajid Ali', 'Google review', NULL, 'Excellent service and good quality product in reasonable price 👍', 5, 1),
('Haseeb Mansuri', 'Google review', NULL, 'Satisfied with the product. Thanks for the product which I bought.', 5, 2);
