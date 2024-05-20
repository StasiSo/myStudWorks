const mysql = require("mysql2");
const express = require("express");
 
const app = express();
const urlencodedParser = express.urlencoded({extended: false});
 
const pool = mysql.createPool({
  connectionLimit: 5,
  host: "localhost",
  user: "Director",
  database: "sklad",
  password: "pwd"
});
const user = 'Director'
 
// const pool = mysql.createPool({
//   connectionLimit: 5,
//   host: "localhost",
//   user: "Viewer",
//   database: "sklad",
//   password: "pwd2"
// });
// const user = 'Viewer'

app.set("view engine", "hbs");
 
// получение меню
app.get("/", function(req, res){
  res.render("index.hbs");
});

//поставщики
{
// получение списка поставщиков
app.get("/index_vendor", function(req, res){
    pool.query("SELECT * FROM Vendor", function(err, data) {
      if(err) return console.log(err);
      res.render("vendor/index_vendor.hbs", {
          Vendor: data
      });
    });
});

// возвращаем форму для добавления данных
app.get("/create_vendor", function(req, res){
  if(user=="Viewer"){
    res.send('У вас нет прав на изменение состояния таблиц <br/><br/><a href="/index_vendor">К справочнику поставщиков</a>');
  } else {
    res.render("vendor/create_vendor.hbs");
  }
});

// получаем отправленные данные и добавляем их в БД 
app.post("/create_vendor", urlencodedParser, function (req, res) {
         
    if(!req.body) return res.sendStatus(400);
    const name = req.body.name;
    const inn = req.body.inn;
    const adress = req.body.adress_1 + ' г. ' + req.body.adress_2 + ', ул. ' + req.body.adress_3 + ', д. ' + req.body.adress_4;
    const bank_adress = req.body.bank_adress_1 + ' г. ' + req.body.bank_adress_2 + ', ул. ' + req.body.bank_adress_3 + ', д. ' + req.body.bank_adress_4;
    const bank_number = req.body.bank_number;
    pool.query("INSERT INTO Vendor (VendorName, VendorINN, VendorAdress, VendorBankAdress, VendorBankNumber) VALUES (?,?,?,?,?)", [name, inn, adress, bank_adress, bank_number], function(err, data) {
      if(err) {
          res.send('Поставщик с таким наименованием уже находится в справочнике поставщиков! <br/><br/><a href="/index_vendor">К списку поставщиков</a>');
          return console.log(err);
      }
      else{
        res.redirect("/index_vendor");
      }
    });
});
 
// получем id редактируемого пользователя, получаем его из бд и отправлям с формой редактирования
app.get("/edit_vendor/:id", function(req, res){
  const id = req.params.id;
  if(user=="Viewer"){
    res.send('У вас нет прав на изменение состояния таблиц <br/><br/><a href="/index_vendor">К справочнику поставщиков</a>');
  } else {
    pool.query("SELECT * FROM Vendor WHERE VendorID=?", [id], function(err, data) {
      if(err) return console.log(err);
      res.render("vendor/edit_vendor.hbs", {
          Vendor: data[0]
      });
    });
  }
});

// получаем отредактированные данные и отправляем их в БД
app.post("/edit_vendor", urlencodedParser, function (req, res) {    
  if(!req.body) return res.sendStatus(400);
  const id = req.body.id;
  const name = req.body.name;
  const inn = req.body.inn;
  const adress = req.body.adress;
  const bank_adress = req.body.bank_adress;
  const bank_number = req.body.bank_number;
  pool.query("UPDATE Vendor SET VendorName=?, VendorINN=?, VendorAdress=?, VendorBankAdress=?, VendorBankNumber=? WHERE VendorID=?", [name, inn, adress, bank_adress, bank_number, id], function(err, data) {
    if(err) {
        res.send('Поставщик с таким наименованием уже находится в справочнике поставщиков! <br/><br/><a href="/index_vendor">К списку поставщиков</a>');
        return console.log(err);
    }
    res.redirect("/index_vendor");
  });
});
 
// получаем id удаляемого пользователя и удаляем его из бд
app.post("/delete_vendor/:id", function(req, res){
          
  const id = req.params.id;
  if(user=="Viewer"){
    res.send('У вас нет прав на изменение состояния таблиц <br/><br/><a href="/index_vendor">К справочнику поставщиков</a>');
  } else {
    pool.query("DELETE FROM Vendor WHERE VendorID=?", [id], function(err, data) {
      if(err) return console.log(err);
      res.redirect("/index_vendor");
    });
  }
});
}

//документы
{
// получение списка документов
app.get("/index_document", function(req, res){
    pool.query("SELECT * FROM Document", function(err, data) {
      if(err) return console.log(err);
      res.render("document/index_document.hbs", {
          Document: data
      });
    });
});

// возвращаем форму для добавления данных
app.get("/create_document", function(req, res){
  if(user=="Viewer"){
    res.send('У вас нет прав на изменение состояния таблиц <br/><br/><a href="/index_document">К справочнику документов</a>');
  } else {
    pool.query("SELECT * FROM Vendor", function(err, data) {
      if(err) return console.log(err);
      res.render("document/create_document.hbs", {
          Vendor: data
      });
    });
  }
});

// получаем отправленные данные и добавляем их в БД 
app.post("/create_document", urlencodedParser, function (req, res) {
         
    if(!req.body) return res.sendStatus(400);
    const num = req.body.num;
    const date = req.body.date;
    const name = req.body.name;
    const vendor = req.body.vendor;
    pool.query("INSERT INTO Document (DocumentNum, DocumentDate, DocumentName, DocumentVendor) VALUES (?,?,?,?)", [num, date, name, vendor], function(err, data) {
      if(err) {
        res.send('Данные некорректны <br/><br/><a href="/index_document">К списку документов</a>');
        return console.log(err);
      }
      res.redirect("/index_document");
    });
});

//добавление материала к документу
app.get("/add_material/:id", function(req, res){
  const id = req.params.id;
  if(user=="Viewer"){
    res.send('У вас нет прав на изменение состояния таблиц <br/><br/><a href="/index_document">К справочнику документов</a>');
  } else {
    pool.query("SELECT * FROM Material", function(err, data) {
      if(err) return console.log(err);
      res.render("document/add_material.hbs", {
          Material: data, id
      });
    });
  }
});

// получаем данные и отправляем их в БД
app.post("/add_material", urlencodedParser, function (req, res) {    
  if(!req.body) return res.sendStatus(400);
  const id = req.body.id;
  const material = req.body.material;
  pool.query("UPDATE Document SET DocumentMaterial=? WHERE DocumentID=?", [material, id], function(err, data) {
    if(err) {
        res.send('чет-не то, дружище <br/><br/><a href="/index_document">К списку документов</a>');
        return console.log(err);
    }
    res.redirect("/index_document");
  });
});

// получаем id удаляемого и удаляем его из бд
app.post("/delete_document/:id", function(req, res){
          
  const id = req.params.id;
  if(user=="Viewer"){
    res.send('У вас нет прав на изменение состояния таблиц <br/><br/><a href="/index_document">К справочнику документов</a>');
  } else {
    pool.query("DELETE FROM Document WHERE DocumentID=?", [id], function(err, data) {
      if(err) return console.log(err);
      res.redirect("/index_document");
    });
  }
});
}

//меры
{
// получение списка мер
app.get("/index_measure", function(req, res){
  pool.query("SELECT * FROM Measure", function(err, data) {
    if(err) return console.log(err);
    res.render("measure/index_measure.hbs", {
        Measure: data
    });
  });
});

// возвращаем форму для добавления данных
app.get("/create_measure", function(req, res){
  if(user=="Viewer"){
    res.send('У вас нет прав на изменение состояния таблиц <br/><br/><a href="/index_measure">К справочнику единиц измерения</a>');
  } else {
    res.render("measure/create_measure.hbs");
  } 
});

// получаем отправленные данные и добавляем их в БД 
app.post("/create_measure", urlencodedParser, function (req, res) {
       
  if(!req.body) return res.sendStatus(400);
  const name = req.body.name;
  pool.query("INSERT INTO Measure (MeasureName) VALUES (?)", [name], function(err, data) {
    if(err) {
      res.send('Такая единица измерения уже есть в справочнике <br/><br/><a href="/index_measure">К справочнику единиц измерения</a>');
      return console.log(err);
    }
    res.redirect("/index_measure");
  });
});

// получаем id удаляемого и удаляем его из бд
app.post("/delete_measure/:id", function(req, res){
        
  const id = req.params.id;
  if(user=="Viewer"){
    res.send('У вас нет прав на изменение состояния таблиц <br/><br/><a href="/index_measure">К справочнику единиц измерения</a>');
  } else {
    pool.query("DELETE FROM Measure WHERE MeasureID=?", [id], function(err, data) {
      if(err) return console.log(err);
      res.redirect("/index_measure");
    });
  }
});
}

//материалы
{
// получение списка материалов
app.get("/index_material", function(req, res){
  pool.query("SELECT * FROM Material ORDER BY MaterialKlass, MaterialGroup", function(err, data) {
    if(err) return console.log(err);
    res.render("material/index_material.hbs", {
        Material: data
    });
  });
});

// возвращаем форму для добавления данных
app.get("/create_material", function(req, res){
  if(user=="Viewer"){
    res.send('У вас нет прав на изменение состояния таблиц <br/><br/><a href="/index_material">К справочнику материалов</a>');
  } else {
    pool.query("SELECT * FROM Measure", function(err, data) {
      if(err) return console.log(err);
      res.render("material/create_material.hbs", {
          Measure: data
      });
    });
  }
});

// получаем отправленные данные и добавляем их в БД 
app.post("/create_material", urlencodedParser, function (req, res) {
       
  if(!req.body) return res.sendStatus(400);
  const klass = req.body.klass;
  const group = req.body.group;
  const name = req.body.name;
  const measure = req.body.measure;
  pool.query("INSERT INTO Material (MaterialKlass, MaterialGroup, MaterialName, MaterialMeasure) VALUES (?, ?, ?, ?)", [klass, group, name, measure], function(err, data) {
    if(err) {
      res.send('што-то не так <br/><br/><a href="/index_material">К списку материалов</a>');
      return console.log(err);
    }
    res.redirect("/index_material");
  });
});

// получаем id удаляемого и удаляем его из бд
app.post("/delete_material/:id", function(req, res){
        
  const id = req.params.id;
  if(user=="Viewer"){
    res.send('У вас нет прав на изменение состояния таблиц <br/><br/><a href="/index_material">К справочнику материалов</a>');
  } else {
    pool.query("DELETE FROM Material WHERE MaterialID=?", [id], function(err, data) {
      if(err) return console.log(err);
      res.redirect("/index_material");
    });
  }
});
}

//единицы хранения
{
  // получение списка
  app.get("/index_order", function(req, res){
    pool.query("SELECT * FROM Material_Order", function(err, data) {
      if(err) return console.log(err);
      res.render("order/index_order.hbs", {
          Material_Order: data
      });
    });
  });
  
  // возвращаем форму для добавления данных
  app.get("/create_order", function(req, res){
    if(user=="Viewer"){
      res.send('У вас нет прав на изменение состояния таблиц <br/><br/><a href="/index_order">Назад</a>');
    } else {
      pool.query("SELECT Vendor.VendorID, Vendor.VendorName, Document.DocumentID,\
      Document.DocumentNum, Document.DocumentName, Document.DocumentVendor, \
      Document.DocumentMaterial, Material.MaterialID, Material.MaterialMeasure, Measure.MeasureID, Measure.MeasureName \
      FROM Vendor, Document, Material, Measure \
      WHERE Vendor.VendorName = Document.DocumentVendor AND Material.MaterialName = Document.DocumentMaterial AND Measure.MeasureName = Material.MaterialMeasure", 
      function(err, data) {
        if(err) return console.log(err);
        res.render("order/create_order.hbs", {
          Some: data
        });
      });
    }
  });
  
  // получаем отправленные данные и добавляем их в БД 
  app.post("/create_order", urlencodedParser, function (req, res) {
         
    if(!req.body) return res.sendStatus(400);
    const date = req.body.date;
    const num = req.body.num;
    const document = req.body.document;
    const measure_price = req.body.measure_price;
    const material_sum = req.body.material_sum;
    const material_num = measure_price * material_sum;
    pool.query("INSERT INTO Material_Order (OrderDate, OrderVendorID, OrderNum,\
      OrderDocumentID, OrderDocumentNum, OrderMaterialID, OrderMaterialNum, OrderMeasureID, OrderMaterialSum, OrderMeasurePrice) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
      [date, document.split(' - ')[4], num, document.split(' - ')[0], document.split(' - ')[1], document.split(' - ')[6], material_num, document.split(' - ')[8], material_sum, measure_price], function(err, data) {
      if(err) {
        res.send('што-то не так <br/><br/><a href="/index_order">К списку единиц хранения</a>');
        return console.log(err);
      }
      res.redirect("/index_order");
    });
  });
  
  // получаем id удаляемого и удаляем его из бд
  app.post("/delete_order/:id", function(req, res){
          
    const id = req.params.id;
    if(user=="Viewer"){
      res.send('У вас нет прав на изменение состояния таблиц <br/><br/><a href="/index_order">Назад</a>');
    } else {
      pool.query("DELETE FROM Material_Order WHERE OrderID=?", [id], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/index_order");
      });
    }
  });
}

//количество поставщиков материала
{
  app.get("/index_count_material", function(req, res){
      pool.query("SELECT DISTINCT DocumentMaterial FROM Document", function(err, data) {
        if(err) return console.log(err);
        res.render("count_material/index_count_material.hbs", {
            Document: data
        });
      });
  });

  app.post("/count_material/:material", urlencodedParser, function(req, res){
    
    const material = req.params.material;
    pool.query("SELECT COUNT(DISTINCT DocumentVendor) FROM Document WHERE DocumentMaterial=?", [material], function(err, data) {
      if(err) return console.log(err);
      var data1 = JSON.stringify(data);
      var data2 = parseInt(data1.match(/\d+/));
      res.send(material + ' поставляют: ' + data2.toString() + ' поставщикa(ов). <br/><br/><a href="/index_count_material">Назад</a>');
    });
  });
}

//количество поставщиков по адресу банка
{
  app.get("/index_count_bank", function(req, res){
      pool.query("SELECT DISTINCT VendorBankAdress FROM Vendor", function(err, data) {
        if(err) return console.log(err);
        res.render("count_bank/index_count_bank.hbs", {
            Vendor: data
        });
      });
  });

  app.post("/count_bank/:bank", urlencodedParser, function(req, res){
    
    const bank = req.params.bank;
    pool.query("SELECT COUNT(DISTINCT VendorName) FROM Vendor WHERE VendorBankAdress=?", [bank], function(err, data) {
      if(err) return console.log(err);
      var data1 = JSON.stringify(data);
      var data2 = parseInt(data1.match(/\d+/));
      res.send('Услугами банка по адресу ' + bank + ' пользуются: ' + data2.toString() + ' поставщикa(ов). <br/><br/><a href="/index_count_bank">Назад</a>');
    });
  });
}

//список поставщиков с реквизитами материала
{
  app.get("/index_count_vendor", function(req, res){
      pool.query("SELECT DISTINCT DocumentMaterial FROM Document", function(err, data) {
        if(err) return console.log(err);
        res.render("count_vendor/index_count_vendor.hbs", {
            Document: data
        });
      });
  });

  app.post("/count_vendor/:material", urlencodedParser, function(req, res){
    
    const material = req.params.material;
    pool.query("SELECT DISTINCT Material.MaterialName, Material.MaterialKlass, Material.MaterialGroup, Material.MaterialMeasure, \
    Document.DocumentVendor FROM Material, Document WHERE Document.DocumentMaterial=? and Material.MaterialName=Document.DocumentMaterial", [material], function(err, data) {
      if(err) return console.log(err);
      res.render("count_vendor/page_count_vendor.hbs", {
          Some: data, Smth: data[0]
      });
    });
  });
}

app.listen(3000, function(){
  console.log("Сервер ожидает подключения...");
});


