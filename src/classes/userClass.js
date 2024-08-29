export class userClass{
    id;
    first_name;
    last_name;
    username;
    email;
    membership;
    manager;

    constructor(id, first_name, last_name, username, email, member, manager){
        this.id = id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.username = username;
        this.email = email;
        this.membership = member;
        this.manager = manager;
    }

    toObject(){
        return {
            id: this.id,
            first_name: this.first_name,
            last_name: this.last_name,
            username: this.username,
            email: this.email,
            membership: this.membership,
            manager: this.manager
        }
    }

    setSession(){
        sessionStorage.setItem('logeduser',JSON.stringify(this.toObject()))
    }
}