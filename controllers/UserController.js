class UserController {
    constructor(formIdCreate, formIdUpdate, tableId) {
        this.formEl = document.getElementById(formIdCreate);
        this.formElUpdate = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);

        this.onSubmit();
        this.onEdit();
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

            tr.dataset.user = JSON.stringify(values);
            tr.innerHTML = `
                <td>
                    <img src="${values.photo}" alt="User Image" class="img-circle img-sm">
                </td>
                <td>${values.name}</td>
                <td>${values.email}</td>
                <td>${(values.admin ? 'Sim' : 'Não')}</td>
                <td>${Utils.dateFormat(values.register)}</td>
                <td>
                    <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
                    <button type="button" class="btn btn-danger btn-xs btn-flat">Excluir</button>
                </td>
            `;

            this.addEventsTr(tr);
            this.updateCounters();
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
            this.getPhoto().then((content) => {
                values.photo = content;
                this.addTableRow(values);

                this.formEl.reset();
                btn.disabled = false;
            }, (e) => {
                console.error(e);
            });
        });
    }

    getPhoto() {
        return new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            let elements = [...this.formEl.elements].filter(item => {
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

            if (field.name === "gender" && field.checked) {
                user[field.name] = field.value;
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

    addTableRow(user) {
        let tr = document.createElement('tr');
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
                <button type="button" class="btn btn-danger btn-xs btn-flat">Excluir</button>
            </td>
        `;

        this.addEventsTr(tr);
        this.tableEl.appendChild(tr);
        this.updateCounters();
    }

    addEventsTr(tr) {
        tr.querySelector(".btn-edit").addEventListener("click", e => {
            let json = JSON.parse(tr.dataset.user);
            let form  =  document.querySelector("#form-user-update");

            form.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json) {
               let field = form.querySelector("[name="+ name.replace("_", "") + "]");

               if (field) {
                    switch (field.type) {
                        case 'file':
                            continue;
                            break;
                        case 'radio':
                            field = form.querySelector("[name="+ name.replace("_", "") + "][value=" + json[name] + "]");
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