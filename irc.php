<?php

class Component_irc extends Component {
  public function init() {
    //OrmManager::LoadModel("irc");
  }

  public function controller_irc($args) {
    $vars = array();
    $vars["nick"] = any($args["nick"], array_get($_SESSION, "irc.nickname"), sprintf("peon%04d", rand(0, 9999)));
    array_set($_SESSION, "irc.nickname", $vars["nick"]);
    return $this->GetComponentResponse("./irc.tpl", $vars);
  }
}  
