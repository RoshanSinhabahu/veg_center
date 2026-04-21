-- ================================================================
-- VegCenter Database Schema
-- Run this entire script in phpMyAdmin SQL tab
-- Make sure you have selected the 'vegcenter' database first
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Vendor
-- ----------------------------------------------------------------
CREATE TABLE Vendor (
  vendor_id  INT          AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  phone_num  VARCHAR(15),
  address    VARCHAR(200)
);

-- ----------------------------------------------------------------
-- 2. User
-- ----------------------------------------------------------------
CREATE TABLE User (
  user_id    INT           AUTO_INCREMENT PRIMARY KEY,
  user_name  VARCHAR(20)   NOT NULL UNIQUE,
  password   VARCHAR(260)  NOT NULL,
  name       VARCHAR(50),
  vendor_id  INT,
  phone_num  VARCHAR(15),
  address    VARCHAR(200),
  FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id)
);

-- ----------------------------------------------------------------
-- 3. Farmer
-- ----------------------------------------------------------------
CREATE TABLE Farmer (
  far_id     INT           AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)   NOT NULL,
  address    VARCHAR(200),
  phone_num  VARCHAR(15),
  acc_num    VARCHAR(35),
  bank_name  VARCHAR(100),
  reg_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- 4. Produce
-- ----------------------------------------------------------------
CREATE TABLE Produce (
  produce_id     INT            AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(30)    NOT NULL,
  price_per_unit DECIMAL(10,2)  NOT NULL
);

-- ----------------------------------------------------------------
-- 5. Entries
-- ----------------------------------------------------------------
CREATE TABLE Entries (
  entry_id          INT            AUTO_INCREMENT PRIMARY KEY,
  far_id            INT            NOT NULL,
  date              DATE           NOT NULL,
  total_amount      DECIMAL(10,2)  NOT NULL,
  expected_pay_date DATE,
  payment_method    ENUM('cash', 'bank_transfer')          DEFAULT 'cash',
  payment_status    ENUM('paid', 'partial', 'pending')     DEFAULT 'pending',
  paid_time         TIMESTAMP      NULL,
  created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (far_id) REFERENCES Farmer(far_id)
);

-- ----------------------------------------------------------------
-- 6. Entry_Items
-- ----------------------------------------------------------------
CREATE TABLE Entry_Items (
  entry_itm_id   INT            AUTO_INCREMENT PRIMARY KEY,
  entry_id       INT            NOT NULL,
  produce_id     INT            NOT NULL,
  quantity       DECIMAL(8,3)   NOT NULL,
  price_per_unit DECIMAL(10,2)  NOT NULL,
  amount         DECIMAL(10,2)  NOT NULL,
  FOREIGN KEY (entry_id)   REFERENCES Entries(entry_id)  ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (produce_id) REFERENCES Produce(produce_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ----------------------------------------------------------------
-- 7. Payment
-- ----------------------------------------------------------------
CREATE TABLE Payment (
  pay_id    INT            AUTO_INCREMENT PRIMARY KEY,
  far_id    INT            NOT NULL,
  amount    DECIMAL(10,2)  NOT NULL,
  status    ENUM('paid', 'partial', 'pending')  DEFAULT 'pending',
  notes     VARCHAR(200),
  FOREIGN KEY (far_id) REFERENCES Farmer(far_id)
);

-- ----------------------------------------------------------------
-- 8. Stock Sales
-- ----------------------------------------------------------------
CREATE TABLE stock_sales (
  sale_id       INT            AUTO_INCREMENT PRIMARY KEY,
  party_name    VARCHAR(100)   NOT NULL,
  date          DATE           NOT NULL,
  total_amount  DECIMAL(10,2)  NOT NULL,
  notes         VARCHAR(200),
  created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- 9. Stock Sale Items
-- ----------------------------------------------------------------
CREATE TABLE stock_sale_items (
  item_id        INT            AUTO_INCREMENT PRIMARY KEY,
  sale_id        INT            NOT NULL,
  produce_id     INT            NOT NULL,
  quantity       DECIMAL(8,3)   NOT NULL,
  price_per_unit DECIMAL(10,2)  NOT NULL,
  amount         DECIMAL(10,2)  NOT NULL,
  FOREIGN KEY (sale_id)    REFERENCES stock_sales(sale_id)  ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (produce_id) REFERENCES Produce(produce_id)   ON DELETE CASCADE ON UPDATE CASCADE
);
