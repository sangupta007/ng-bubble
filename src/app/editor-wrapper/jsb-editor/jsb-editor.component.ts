import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {UtilityService} from '../../utility.service';
import {EventService} from '../../event.service';
import {LoggingService} from '../logging.service';


@Component({
  selector: 'jsb-editor',
  template: `<textarea #textEditorPlaceholder></textarea>`,
  styleUrls: ['./jsb-editor.component.scss']
})
export class JsbEditorComponent implements OnInit, AfterViewInit {

  @ViewChild('textEditorPlaceholder') textEditorPlaceholder: ElementRef;

  @Input() level = 3;
  @Input() set codeText(val: object|string) {

    setTimeout(()=>{
      this._codeText = this.stringifyInput(val, this.level);
      this.setValueInCodeMirror(this.codemirror, this._codeText);
    })
  }

  stringifyInput(val: any, level:number): string {

    if (val === null) return '';/*undef*/
    if (val === '') return '';/*undef*/
    if (val === undefined) return '';/*undef*/
    let output;
    try {
      output=  typeof val === 'function' || typeof val === 'object' ? JSON.stringify(val,null, '\t') : val;//val.toString();
    }catch (e) {
      LoggingService.log(e);
    }
    return output;
  }


  _codeText: string;
  //

  codemirror;

  constructor() {
  }

  ngOnInit() {
    EventService.foldCodeInCodemirror$.subscribe((shouldFoldCode)=>{
      if(shouldFoldCode){
        // UtilityService.foldCode(this.codemirror);
      }else {
        // UtilityService.unfoldCode(this.codemirror);
      }
    })
  }

  ngAfterViewInit(): void {
    const editorTextArea = this.textEditorPlaceholder.nativeElement;
    setTimeout(() => {
      this.codemirror = UtilityService.codeMirrorInit(editorTextArea);


      this._codeText = this.stringifyInput(this._codeText, this.level);
      //
      this.setValueInCodeMirror(this.codemirror, this._codeText);
    });
  }

  @Input() shouldFoldCode = true;

  setValueInCodeMirror(codemirror, codeText: string) {

    if (!codemirror) {
      // codemirror.setValue('undefined value');
      return;
    }
    codemirror.setValue(codeText);
    codemirror.operation(() => {
      setTimeout(()=>{

        // if (this.shouldFoldCode) UtilityService.foldCode(codemirror);
      })
    });
  }


  unfoldCode(codemirror){
    // UtilityService.unfoldCode(codemirror);
  }

}
