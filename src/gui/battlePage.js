import {GamePane} from "./gamePane.js";
import {WarriorHud} from "./warriorHud.js";
import {Button} from "./button.js";

export class BattlePage extends GamePane{
    constructor(){
        super();
        this.team1 = null;
        this.team2 = null;
        this.team1Turn = true;
        this.vsText = ""; //display actives
        this.dataText = ""; //displays warrior data
        this.turnPart = 0;
    }
    
    setTeams(team1, team2){
        this.team1 = team1;
        this.team2 = team2;
        team1.enemyTeam = team2;
        team2.enemyTeam = team1;
        team1.init_for_battle();
        team2.init_for_battle();
        
        let y = 0;
        let hud;
        team1.members_rem.forEach((member)=>{
            hud = this.hpButtonFor(member);
            hud.setPos(0, y);
            this.addChild(hud);
            y += 20;
        });
        
        y = 0;
        team2.members_rem.forEach((member)=>{
            hud = this.hpButtonFor(member);
            hud.setPos(80, y);
            this.addChild(hud);
            y += 20;
        });
        
        
        this.team1Turn = Math.random() >= 0.5;
        this.turnPart = 1;
        this.update();
    }
    
    hpButtonFor(warrior){
        let ret = new WarriorHud(warrior);
        ret.addOnClick(()=>{
            this.dataText = warrior.name + ":\n";
            this.dataText += "\tSpecial Move: " + warrior.special.name + " " + warrior.pip + "\n";
            this.dataText += "\tElement: " + warrior.element.name + "\n";
            this.dataText += "\tPhysical: " + warrior.get_phys() + "\n";
            this.dataText += "\tElemental: " + warrior.get_ele() + "\n";
            this.dataText += "\tMax HP: " + warrior.max_hp + "\n";
            this.dataText += "\tArmor: " + warrior.armor + "\n";
            this.update();
        });
        return ret;
    }
    
    heartCollectionFor(team){
        let ret = new Button("Heart Collection");
        ret.setColor("red");
        ret.setPos(40, 90);
        ret.setSize(10, 10);
        ret.addOnClick(()=>{
            team.active.nat_regen();
            this.turnPart2For(team);
        });
        return ret;
    }
    
    bombFor(team){
        let ret = new Button("Bomb");
        ret.setColor("black");
        ret.setPos(50, 90);
        ret.setSize(10, 10);
        ret.addOnClick(()=>{
            let d = team.active.perc_hp(0.15);
            team.active.hp_rem -= d;
            if(team.active.hp_rem <= 1){
                team.active.hp_rem = 1;
            }
            team.active.hp_rem = Math.round(team.active.hp_rem);
            
            this.turnPart2For(team);
        });
        return ret;
    }
    
    nmButtonFor(team){
        let ret = new Button("Normal Move");
        ret.setPos(45, 70);
        ret.setSize(10, 10);
        ret.setColor(team.active.element.color);
        ret.addOnClick(()=>{
            //team.active.use_normal_move();
        });
        return ret;
    }
    
    purgeTempButtons(){
        if(this.heartCol){
            this.removeChild(this.heartCol);
        }
        if(this.bomb){
            this.removeChild(this.bomb);
        }
        
        if(this.nm){
            this.removeChild(this.nm);
        }
    }
    
    //might want to move some of this back to team later
    turnPart1For(team){
        let c = this.controller.canvas;
        
        team.check_if_ko();
        if(this.team1.won || this.team2.won){
            return;
        } //#################################STOPS HERE IF A TEAM WON
        team.members_rem.forEach((member)=>member.reset_heal());
        
        this.purgeTempButtons();
        
        //this will get erased by draw()
        c.setColor("blue");
        for(let i = 0; i < team.energy; i++){
            c.circle(i * 10, 90, 5);
        }
        
        c.setColor("red");
        for(let i = 0; i < team.enemyTeam.energy; i++){
            c.circle(100 - i * 10, 90, 5);
        }
        
        this.vsText = team.active.name + " VS " + team.enemyTeam.active.name;
        
        if ((team.active.last_phys_dmg + team.active.last_ele_dmg) > 0){
			this.heartCol = this.heartCollectionFor(team);
            this.bomb = this.bombFor(team);
            this.addChild(this.heartCol);
            this.addChild(this.bomb);
		} else {
            this.turnPart2For(team); //recursive. Might not be good
        }
    }
    
    teamPart2For(team){
        let c = this.controller.canvas;
        this.turnPart = 2;
        
        this.purgeTempButtons();
        
        team.turn_part2(); //lots of non-GUI stuff done here
        
        //this will get erased by draw()
        c.setColor("blue");
        for(let i = 0; i < team.energy; i++){
            c.circle(i * 10, 90, 5);
        }
        
        c.setColor("red");
        for(let i = 0; i < team.enemyTeam.energy; i++){
            c.circle(100 - i * 10, 90, 5);
        }
        
        this.vsText = team.active.name + " VS " + team.enemyTeam.active.name;
        
        this.nm = this.nmButtonFor(team);
        //if(team.energy >= 2){team.display_specials();}
    }
    
    update(){
        //more stuffs here
        if(this.team1Turn !== null && this.turnPart === 1){
            if(this.team1Turn){
                this.turnPart1For(this.team1);
            } else {
                this.turnPart1For(this.team2);
            }
        }
        this.draw();
    }
    
    draw(){
        super.draw();
        this.controller.canvas.text(20, 0, this.vsText);
        let i = 20;
        this.dataText.split("\n").forEach((line)=>{
            this.controller.canvas.text(20, i, line);
            i += 5;
        });
    }
}