class UserController {
    constructor(formIdCreate, formIdUpdate, tableId) {
        this.formEl = document.getElementById(formIdCreate);
        this.formElUpdate = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);

        this.onSubmit();
        this.onEdit();
        this.selectAll();
    }

    onEdit() {
        document.querySelector("#user-update .btn-cancel").addEventListener("click", e => {
            this.showPanelCreate();
        });

        this.formElUpdate.addEventListener("submit", event => {
            event.preventDefault();

            let btn = this.formElUpdate.querySelector("[type=submit]");
            btn.disabled = true;

            let values = this.getValues(this.formElUpdate);

            let indexRow = this.formElUpdate.dataset.trIndex;
            let tr = this.tableEl.rows[indexRow];
            let oldUser = JSON.parse(tr.dataset.user);
            let result = Object.assign({}, oldUser, values);
           
            this.getPhoto(this.formElUpdate).then((content) => {
                if (!values.photo) {
                    result._photo = oldUser._photo;
                } else {
                    result._photo = content;
                }

                let user = new User();
                user.loadFromJSON(result);
                user.save();
                this.getTr(user, tr);
            
                this.updateCounters();
                this.formElUpdate.reset();
                this.showPanelCreate();

                btn.disabled = false;
            }, (e) => {
                console.error(e);
            });
        });
    }

    onSubmit() {
        this.formEl.addEventListener("submit", event => {
            event.preventDefault();

            let btn = this.formEl.querySelector("[type=submit]");
            btn.disabled = true;

            let values = this.getValues(this.formEl);

            if (!values) {
                return false;
            }

            this.getPhoto(this.formEl).then((content) => {
                values.photo = content;
                values.save();

                this.addTableRow(values);

                this.formEl.reset();
                btn.disabled = false;
            }, (e) => {
                console.error(e);
            });
        });
    }

    getPhoto(formEl) {
        return new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            let elements = [...formEl.elements].filter(item => {
               if (item.name === 'photo') {
                   return item;
                }
            });
            let file = elements[0].files[0];

            fileReader.onload = () => {
                resolve(fileReader.result);
            };

            fileReader.onerror = (e) => {
                reject(e);
            };
    
            if (file) {
                fileReader.readAsDataURL(file);
            } else {
                return resolve('dist/img/boxed-bg.png');
            }
        });
    }

    getValues(formEl) {
        let user = {};
        let isValid = true;

        [...formEl.elements].forEach(function(field, index){

            //Required fields
            if (['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value) {
                field.parentElement.classList.add('has-error');
                isValid = false;
            }

            if (field.name == 'gender') {
                if (field.checked) {
                    user[field.name] = field.value;
                }
            } else if (field.name == 'admin'){
                user[field.name] = field.checked;
            } else {
                user[field.name] = field.value;
            }
        });
    
        if (!isValid) {
            return false;
        }

        return new User(
            user.name,
            user.gender,
            user.birth,
            user.country,
            user.email,
            user.password,
            user.photo,
            user.admin
        );
    }

    getUsersStorage() {
        let users = [];

        if (localStorage.getItem("users")) {
            //users = JSON.parse(sessionStorage.getItem("users"));
            users = JSON.parse(localStorage.getItem("users"));
        }

        return users;
    }

    selectAll() {
        let users = this.getUsersStorage();

        users.forEach(dataUser => {
            let user = new User();
            user.loadFromJSON(dataUser);
            this.addTableRow(user);
        });

    }

    addTableRow(user) {
        let tr = this.getTr(user);

        this.tableEl.appendChild(tr);
        this.updateCounters();
    }

    getTr(user, tr = null) {
        if (tr == null) {
            tr = document.createElement('tr');
        }

        tr.dataset.user = JSON.stringify(user);

        tr.innerHTML = `
            <td>
                <img src="${user.photo}" alt="User Image" class="img-circle img-sm">
            </td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${(user.admin ? 'Sim' : 'Não')}</td>
            <td>${Utils.dateFormat(user.register)}</td>
            <td>
                <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
                <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
            </td>
        `;

        this.addEventsTr(tr);
        return tr;
    }

    addEventsTr(tr) {
        tr.querySelector(".btn-delete").addEventListener("click", e => {
            if (confirm("Deseja realmente excluir?")) {
                tr.remove();
                this.updateCounters();
            }
        });

        tr.querySelector(".btn-edit").addEventListener("click", e => {
            let json = JSON.parse(tr.dataset.user);

            this.formElUpdate.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json) {
               let field = this.formElUpdate.querySelector("[name="+ name.replace("_", "") + "]");

               if (field) {
                    switch (field.type) {
                        case 'file':
                            continue;
                            break;
                        case 'radio':
                            field = this.formElUpdate.querySelector("[name="+ name.replace("_", "") + "][value=" + json[name] + "]");
                            field.checked = true;
                            break;
                        case 'checkbox':
                            field.checked = json[name];
                            break;
                        default:
                            field.value = json[name];
                    } 
               }
            }

            this.formElUpdate.querySelector(".photo").src = json._photo;
            this.showPanelUpdate();
        });
    }

    showPanelCreate() {
        document.querySelector("#user-create").style.display = "block";
        document.querySelector("#user-update").style.display = "none";
    }

    showPanelUpdate() {
        document.querySelector("#user-create").style.display = "none";
        document.querySelector("#user-update").style.display = "block";
    }

    updateCounters() {
        let numberUsers = 0;
        let numberUsersAdmin = 0;

        [...this.tableEl.children].forEach(tr => {
            let user = JSON.parse(tr.dataset.user);
            if (user._admin) {
                numberUsersAdmin++;
            }
            numberUsers++;
        });

        document.querySelector("#number-users").innerHTML = numberUsers;
        document.querySelector("#number-users-admin").innerHTML = numberUsersAdmin;
    }
}