export class userClass{
    id;
    first_name;
    last_name;
    username;
    email;
    membership;
    seller;
    distributor;
    manager;

    constructor(id, first_name, last_name, username, email, member, seller, distributor, manager){
        this.id = id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.username = username;
        this.email = email;
        this.membership = member;
        this.seller = seller;
        this.distributor = distributor;
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
            seller: this.seller,
            distributor: this.distributor,
            manager: this.manager
        }
    }

    setSession(){
        sessionStorage.setItem('logeduser',JSON.stringify(this.toObject()))
    }
}